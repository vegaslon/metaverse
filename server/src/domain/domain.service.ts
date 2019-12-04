import { Injectable, OnModuleInit, NotFoundException } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectModel, InjectConnection } from "@nestjs/mongoose";
import { Model, Connection } from "mongoose";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { heartbeat, HeartbeatSession } from "../common/heartbeat";
import { patchDoc, snakeToCamelCaseObject } from "../common/utils";
import { User } from "../user/user.schema";
import { UserService, UserSession } from "../user/user.service";
import { CreateDomainDto, UpdateDomainDto } from "./domain.dto";
import { Domain } from "./domain.schema";
import uuid = require("uuid");
import { MulterFile } from "../common/multer-file.model";
import sharp = require("sharp");
import { GridFSBucket } from "mongodb";

export interface DomainSession {
	users: UserSession[];
}

@Injectable()
export class DomainService implements OnModuleInit {
	// current online domains. this can get big!
	sessions: { [id: string]: DomainSession & HeartbeatSession } = {};

	private userService: UserService;
	public images: GridFSBucket;

	constructor(
		@InjectModel("domains") private readonly domainModel: Model<Domain>,
		@InjectConnection() private connection: Connection,
		private moduleRef: ModuleRef,
	) {
		this.domainModel
			.updateMany({}, { $set: { online: false, onlineUsers: 0 } })
			.exec();

		this.images = new GridFSBucket(connection.db, {
			bucketName: "domains.thumbnails",
		});
	}

	onModuleInit() {
		this.userService = this.moduleRef.get(UserService, { strict: false });
	}

	findById(id: string) {
		return this.domainModel.findById(id);
	}

	async createDomain(user: User, createDomainDto: CreateDomainDto) {
		const domain = new this.domainModel({
			_id: uuid(),
			author: user,
			label: createDomainDto.label, // required
		});

		patchDoc(domain, createDomainDto);

		user.domains.push(domain);
		await user.save();

		return await domain.save();
	}

	async updateDomain(domain: Domain, updateDomainDto: UpdateDomainDto) {
		if (updateDomainDto.domain == null) {
			return domain;
		}

		const dto = snakeToCamelCaseObject(updateDomainDto.domain);
		patchDoc(domain, dto);

		const heartbeatDto = updateDomainDto.domain.heartbeat;
		if (heartbeatDto) {
			heartbeat<DomainSession>(
				this.sessions,
				domain._id,
				session => {
					// initialize
					session.users = [];
				},
				async () => {
					// cleanup if it goes offline
					const offlineDomain = await this.findById(domain._id);
					offlineDomain.online = false;
					offlineDomain.onlineUsers = 0;
					await offlineDomain.save();
				},
			);

			// update domain in db
			domain.online = true;

			if (heartbeatDto.num_users != null)
				if (heartbeatDto.num_users != domain.onlineUsers) {
					domain.lastUpdated = new Date();
					domain.onlineUsers = heartbeatDto.num_users;
				}
		}

		return await domain.save();
	}

	async setPublicKey(domain: Domain, buffer: Buffer) {
		const publicKey =
			Buffer.concat([derPublicKeyHeader, buffer])
				.toString("base64")
				.match(/.{1,60}/g)
				.join(" ") + " ";

		domain.publicKey = publicKey;
		return await domain.save();
	}

	async getUserDomains(user: User) {
		const userPopulated = await this.userService
			.findById(user.id)
			.populate("domains");

		return userPopulated.domains;
	}

	findOnlineDomains(page = 1, amount = 50, anonymousOnly = false) {
		if (page <= 0) page = 1;
		page -= 1;

		if (amount > 50) amount = 50;

		const restriction = anonymousOnly
			? { restriction: "open" }
			: { $or: [{ restriction: "open" }, { restriction: "hifi" }] };

		return this.domainModel
			.find({ online: true, ...restriction })
			.sort({ onlineUsers: -1, lastUpdated: -1 })
			.skip(page * amount)
			.limit(page);
	}

	async deleteDomain(domainId: string) {
		const domain = await this.findById(domainId).populate("author");
		if (domain == null) throw new NotFoundException();

		const user = domain.author;
		const i = (user.domains as any[]).indexOf(domainId);
		user.domains.splice(i, 1);
		await user.save();

		return await domain.remove();
	}

	async changeDomainImage(domain: Domain, file: MulterFile) {
		return new Promise(async (resolve, reject) => {
			await new Promise(resolve => {
				this.images.delete(domain.id, err => {
					resolve();
				});
			});

			const stream = sharp(file.buffer)
				.resize(768, 512, {
					fit: "cover",
					position: "centre",
				})
				.jpeg({
					quality: 80,
				});

			stream.pipe(
				this.images.openUploadStreamWithId(domain.id, null, {
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
}
