import { Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { ObjectID } from "bson";
import { GridFSBucket } from "mongodb";
import { Connection, Model } from "mongoose";
import fetch from "node-fetch";
import * as sharp from "sharp";
import { AuthSignUpDto } from "../auth/auth.dto";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { heartbeat, HeartbeatSession } from "../common/heartbeat";
import { MulterFile } from "../common/multer-file.model";
import { patchObject } from "../common/utils";
import { DomainService } from "../domain/domain.service";
import {
	UserAvailability,
	UserUpdateLocation,
	UserUpdateLocationDto,
} from "./user.dto";
import { User } from "./user.schema";
import uuid = require("uuid");
import { promisify } from "util";
import { Readable } from "stream";

export interface UserSession {
	id: string;
	userId: string;

	minutes: number;

	location: UserUpdateLocation;
}

@Injectable()
export class UserService implements OnModuleInit {
	private domainService: DomainService;
	public images: GridFSBucket;

	constructor(
		@InjectModel("User") private readonly userModel: Model<User>,
		@InjectConnection() private connection: Connection,
		private moduleRef: ModuleRef,
	) {
		this.images = new GridFSBucket(connection.db, {
			bucketName: "userImages",
		});

		(async () => {
			await this.userModel.find(
				{ image: { $ne: null } },
				async (err, users) => {
					for (let user of users) {
						const buffer = (user as any).image as Buffer;
						const stream = new Readable();
						stream.push(buffer);
						stream.push(null);

						stream.pipe(
							this.images.openUploadStreamWithId(user.id, null, {
								contentType: "image/jpg",
							}),
						);

						stream.on("end", async () => {
							(user as any).image = null;
							await user.save();
						});
					}
				},
			);
		})();
	}

	onModuleInit() {
		this.domainService = this.moduleRef.get(DomainService, {
			strict: false,
		});
	}

	// current online users. this can get big!
	sessions: { [username: string]: UserSession & HeartbeatSession } = {};

	findByUsername(username: string) {
		// https://stackoverflow.com/a/45650164
		let loginRegExp = new RegExp(
			"^" + username.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
			"i",
		);
		return this.userModel.findOne({ username: loginRegExp });
	}

	findByEmail(email: string) {
		let loginRegExp = new RegExp(
			"^" + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
			"i",
		);
		return this.userModel.findOne({ email: loginRegExp });
	}

	findByUsernameOrEmail(username: string) {
		let loginRegExp = new RegExp(
			"^" + username.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
			"i",
		);
		return this.userModel.findOne({
			$or: [{ username: loginRegExp }, { email: loginRegExp }],
		});
	}

	findById(idStr: string) {
		try {
			const id = new ObjectID(idStr);
			return this.userModel.findById(id);
		} catch (err) {
			return null;
		}
	}

	findByUsernameRegex(regexp: RegExp) {
		return this.userModel.findOne({
			username: regexp,
		});
	}

	async createUser(authSignUpDto: AuthSignUpDto, hash: string) {
		return await new this.userModel({
			username: authSignUpDto.username,
			email: authSignUpDto.email,
			hash,
		}).save();
	}

	async changeUserImage(user: User, file: MulterFile) {
		return new Promise(async (resolve, reject) => {
			await new Promise(resolve => {
				this.images.delete(user.id, err => {
					resolve();
				});
			});

			const stream = sharp(file.buffer)
				.resize(128, 128, {
					fit: "cover",
					position: "centre",
				})
				.jpeg({
					quality: 100,
				});

			stream.pipe(
				this.images.openUploadStreamWithId(user.id, null, {
					contentType: "image/jpg",
				}),
			);

			stream.on("error", err => {
				reject(err);
			});

			stream.on("end", () => {
				resolve();
			});
		});
	}

	async changeUserImageFromUrl(user: User, imageUrl: string) {
		try {
			const res = await fetch(imageUrl);
			const buffer = await res.buffer();

			return this.changeUserImage(user, {
				fieldname: "",
				originalname: "",
				encoding: "",
				mimetype: "",
				buffer,
			});
		} catch (err) {
			return;
		}
	}

	async findAll() {
		return this.userModel.find({});
	}

	async heartbeat(user: User) {
		const { session, isNew } = heartbeat<UserSession>(
			this.sessions,
			user.username,
			async session => {
				// clean up session from domains
				const domainId = session.location.domain_id;
				if (domainId == null) return;

				const domainSession = this.domainService.sessions[domainId];
				if (domainSession == null) return;

				const i = domainSession.users.indexOf(session);
				domainSession.users.splice(i, 1);
			},
		);

		if (isNew) {
			session.id = uuid();
			session.userId = user._id;
			session.minutes = 0;
			session.location = {
				availability: UserAvailability.none,
				connected: false,
				domain_id: null,
				network_address: "",
				network_port: "",
				node_id: null,
				path: "",
				place_id: null,
			};
		}

		const minutes = Math.floor((+new Date() - +session._since) / 1000 / 60);

		if (session.minutes < minutes) {
			user.minutes += minutes - session.minutes;
			session.minutes = minutes;
			await user.save();
		}

		return session.id;
	}

	async setPublicKey(user: User, buffer: Buffer) {
		const publicKey =
			Buffer.concat([derPublicKeyHeader, buffer])
				.toString("base64")
				.match(/.{1,60}/g)
				.join(" ") + " ";

		user.publicKey = publicKey;
		return await user.save();
	}

	async setUserLocation(
		user: User,
		userUpdateLocationDto: UserUpdateLocationDto,
	) {
		let session = this.sessions[user.username];
		if (session == null) {
			await this.heartbeat(user);
			session = this.sessions[user.username];
		}

		patchObject(session.location, userUpdateLocationDto.location);

		// update user in domain
		if (userUpdateLocationDto.location.domain_id) {
			const domainId = userUpdateLocationDto.location.domain_id;

			const domainSession = this.domainService.sessions[domainId];
			if (domainSession != null) {
				if (!domainSession.users.includes(session)) {
					domainSession.users.push(session);
				}
			}
		}

		// return session id
		return session.id;
	}
}
