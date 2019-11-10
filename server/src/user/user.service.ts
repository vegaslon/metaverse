import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as sharp from "sharp";
import { AuthSignUpDto } from "../auth/auth.dto";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { heartbeat, HeartbeatSession } from "../common/heartbeat";
import { MulterFile } from "../common/multer-file.model";
import { User } from "./user.schema";
import uuid = require("uuid");

interface UserSession {
	id: string;
	minutes: number;
}

@Injectable()
export class UserService {
	constructor(@InjectModel("User") private readonly userModel: Model<User>) {}

	// current online users. this can get big!
	sessions: { [username: string]: UserSession & HeartbeatSession } = {};

	findByUsername(username: string) {
		// https://stackoverflow.com/a/45650164
		let loginRegExp = new RegExp(
			"^" + username.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "$",
			"i",
		);

		return this.userModel.findOne({
			username: loginRegExp,
		});
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

	findById(id: string) {
		return this.userModel.findById(id);
	}

	async createUser(authSignUpDto: AuthSignUpDto, hash: string) {
		return await new this.userModel({
			username: authSignUpDto.username,
			email: authSignUpDto.email,
			hash,
		}).save();
	}

	async changeUserImage(user: User, file: MulterFile) {
		user.image = await sharp(file.buffer)
			.resize(128, 128, {
				fit: "cover",
				position: "centre",
			})
			.jpeg({
				quality: 100,
			})
			.toBuffer();

		console;

		await user.save();
		return;
	}

	async findAll() {
		return this.userModel.find({});
	}

	async heartbeat(user: User) {
		const { session, isNew } = heartbeat<UserSession>(
			this.sessions,
			user.username,
		);

		if (isNew) {
			session.id = uuid();
			session.minutes = 0;
		}

		const minutes = Math.floor((+new Date() - +session._since) / 1000 / 60);

		if (session.minutes < minutes) {
			user.minutesOnline += minutes - session.minutes;
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
}
