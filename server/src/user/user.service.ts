import {
	BadRequestException,
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	OnModuleInit,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { ObjectId } from "bson";
import crypto from "crypto";
import { Request } from "express";
import * as fs from "fs";
import JSZip from "jszip";
import * as mailchecker from "mailchecker";
import { GridFSBucket } from "mongodb";
import { Connection, Model } from "mongoose";
import fetch from "node-fetch";
import * as path from "path";
import sharp from "sharp";
import { AuthSignUpDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { MulterFile } from "../common/multer-file.model";
import {
	docInsideDocArray,
	generateRandomString,
	getMimeType,
	pagination,
	renderDomain,
	renderFriend,
	streamToBuffer,
} from "../common/utils";
import { GetDomainsDto } from "../domain/domain.dto";
import { Domain } from "../domain/domain.schema";
import { DomainService } from "../domain/domain.service";
import { EmailService } from "../email/email.service";
import { DEV } from "../environment";
import { SessionService } from "../session/session.service";
import {
	UserUpdateEmailDto,
	UserUpdateLocationDto,
	UserUpdateNametagDto,
	UserUpdatePasswordDto,
} from "./user.dto";
import { User } from "./user.schema";

const defaultUserImagePath = path.resolve(
	__dirname,
	"../../assets/user-image.jpg",
);
const defaultUserImage = fs.readFileSync(defaultUserImagePath);

@Injectable()
export class UserService implements OnModuleInit {
	public images: GridFSBucket;

	constructor(
		// database
		@InjectConnection() private connection: Connection,
		@InjectModel("users") private readonly userModel: Model<User>,
		// @InjectModel("users.settings")
		// private readonly userSettingsModel: Model<UserSettings>,

		// services
		@Inject(forwardRef(() => DomainService))
		private readonly domainService: DomainService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,
		@Inject(forwardRef(() => SessionService))
		private readonly sessionService: SessionService,
		private readonly emailService: EmailService,

		// external services
		private readonly jwtService: JwtService,
	) {}

	onModuleInit() {
		this.images = new GridFSBucket(this.connection.db, {
			bucketName: "users.images",
		});
	}

	// current online users keyed with username. this can get big!
	//sessions = new Map<string, UserSession & HeartbeatSession>();

	private regexForFinding(query: string, startToFinish = true) {
		// https://stackoverflow.com/a/45650164
		return new RegExp(
			(startToFinish ? "^" : "") +
				query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
				(startToFinish ? "$" : ""),
			"i",
		);
	}

	findById(id: ObjectId | string) {
		if (typeof id == "string") {
			if (ObjectId.isValid(id)) {
				return this.userModel.findById(new ObjectId(id));
			} else {
				return null;
			}
		} else {
			return this.userModel.findById(id);
		}
	}

	findByUsername(username: string) {
		return this.userModel.findOne({
			username: this.regexForFinding(username),
		});
	}

	findByEmail(email: string) {
		return this.userModel.findOne({
			email: this.regexForFinding(email),
		});
	}

	findByUsernameOrEmail(usernameEmail: string) {
		const queryRegExp = this.regexForFinding(usernameEmail);
		return this.userModel.findOne({
			$or: [{ username: queryRegExp }, { email: queryRegExp }],
		});
	}

	findByIdOrUsername(idOrUsername: string) {
		return this.userModel.findOne({
			$or: [
				{ username: this.regexForFinding(idOrUsername) },
				...(ObjectId.isValid(idOrUsername)
					? [{ _id: new ObjectId(idOrUsername) }]
					: []),
			],
		});
	}

	async createUser(
		authSignUpDto: AuthSignUpDto,
		hash: string,
		emailVerified = false,
	) {
		if (DEV) emailVerified = true;

		return await new this.userModel({
			username: authSignUpDto.username,
			email: authSignUpDto.email,
			emailVerified,
			hash,
		}).save();
	}

	async updateUserEmail(user: User, userUpdateEmailDto: UserUpdateEmailDto) {
		const { email } = userUpdateEmailDto;

		if (user.email == email)
			throw new BadRequestException(
				'Email already set to "' + email + '"',
			);

		if (await this.findByEmail(email))
			throw new ConflictException("Email is already in use");

		await this.sendVerify(user, email);
		// will expire after an hour

		return {
			message:
				'Check "' + email + '" for a verification to change your email',
		};
	}

	async updateUserPassword(
		user: User,
		userUpdatePasswordDto: UserUpdatePasswordDto,
		req: Request,
	) {
		const { token, currentPassword, newPassword } = userUpdatePasswordDto;

		if (!token && !currentPassword)
			throw new BadRequestException(
				"Need current password or token from email",
			);

		if (token) {
			const { id, secret } = this.jwtService.verify(token); // will throw if invalid

			if (user.id !== id || user.resetPasswordSecret !== secret)
				throw new BadRequestException("Invalid token");

			user.resetPasswordSecret = "";
		} else {
			const hash = (await this.findById(user.id).select("hash")).hash;
			const correctCurrentPassword = await bcrypt.compare(
				currentPassword,
				hash,
			);
			if (correctCurrentPassword === false)
				throw new ConflictException("Current password is incorrect");
		}

		user.hash = await this.authService.hashPassword(newPassword);
		await user.save();

		try {
			this.emailService.sendPasswordChanged(user, req);
		} catch (err) {
			// throw new InternalServerErrorException();
		}

		return { message: "Password has been changed" };
	}

	async deleteUserImage(user: User) {
		await new Promise(resolve => {
			this.images.delete(user._id, err => {
				resolve();
			});
		});
	}

	changeUserImage(user: User, file: MulterFile) {
		return new Promise(async (resolve, reject) => {
			await this.deleteUserImage(user);

			const imageStream = sharp(file.buffer)
				.resize(128, 128, {
					fit: "cover",
					position: "centre",
				})
				.jpeg({
					quality: 80,
				});

			const uploadStream = this.images.openUploadStreamWithId(
				user._id,
				null,
				{
					contentType: "image/jpeg",
				},
			);

			imageStream.on("error", err => {
				return reject(err);
			});

			uploadStream.on("finish", () => {
				return resolve();
			});

			imageStream.pipe(uploadStream);
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

	async getDefaultUserImage() {
		// let read = false;
		// const stream = new Readable({
		// 	read() {
		// 		if (read) {
		// 			this.push(null);
		// 		} else {
		// 			read = true;
		// 			this.push(defaultUserImage);
		// 		}
		// 		return;
		// 	},
		// });
		return {
			buffer: defaultUserImage,
			contentType: getMimeType(defaultUserImagePath),
		};
	}

	async getGravatarUserImage(email: string) {
		const hash = crypto
			.createHash("md5")
			.update(email.trim().toLowerCase())
			.digest("hex");

		const res = await fetch(
			"https://www.gravatar.com/avatar/" + hash + "?s=128&d=404",
		);
		if (res.ok === false) return null;
		const buffer = await res.buffer();

		return { buffer, contentType: res.headers.get("Content-Type") };
	}

	async getUserImage(
		username: string,
		onlyUserUploaded = false,
	): Promise<{
		buffer: Buffer;
		contentType: string;
	}> {
		const user = await this.findByIdOrUsername(username);

		if (user == null)
			return onlyUserUploaded
				? { buffer: null, contentType: null }
				: this.getDefaultUserImage();

		if ((await this.images.find({ _id: user._id }).count()) > 0) {
			const stream = this.images.openDownloadStream(user._id);
			const buffer = await streamToBuffer(stream);
			return { buffer, contentType: "image/jpeg" };
		}

		if (onlyUserUploaded) return { buffer: null, contentType: null };

		try {
			const gravatar = await this.getGravatarUserImage(user.email);
			if (gravatar !== null) return gravatar;
		} catch (err) {
			// gravatar may be down
			return this.getDefaultUserImage();
		}

		return this.getDefaultUserImage();
	}

	async updateNametagDetails(
		user: User,
		userUpdateNametagDto: UserUpdateNametagDto,
	) {
		const { displayName, genderPronoun } = userUpdateNametagDto;

		if (displayName != null) user.nametag.displayName = displayName;
		if (genderPronoun != null) user.nametag.genderPronoun = genderPronoun;

		await user.save();

		const nametag = JSON.parse(JSON.stringify(user.nametag));
		delete nametag._id;
		return nametag;
	}

	async setPublicKey(user: User, buffer: Buffer) {
		if (buffer.byteLength > 1000 * 1000)
			throw new BadRequestException(
				"Public key can't be bigger than 1 MB",
			);

		const publicKey =
			Buffer.concat([derPublicKeyHeader, buffer])
				.toString("base64")
				.match(/.{1,60}/g)
				.join(" ") + " ";

		user.publicKey = publicKey;
		return user.save();
	}

	async setUserLocation(
		user: User,
		userUpdateLocationDto: UserUpdateLocationDto,
	) {
		const session = await this.sessionService.updateUserLocation(
			user,
			userUpdateLocationDto,
		);

		if (userUpdateLocationDto.location.domain_id) {
			// updateUserLocation doesn't populate
			const domainId: ObjectId = session.domain as any;
			if (docInsideDocArray(user.domainLikes, domainId)) {
				this.domainService.moveLikedDomainToTopForUser(user, domainId);
			}
		}

		return session.sessionId;
	}

	// async getUserSettings(user: User) {
	// 	const userSettings = await this.userSettingsModel.findById(user._id);
	// 	if (userSettings == null) return null;

	// 	try {
	// 		const settings = {
	// 			interface: JSON.parse(userSettings.interface),
	// 			avatarBookmarks: JSON.parse(userSettings.avatarBookmarks),
	// 		};
	// 		return settings;
	// 	} catch (err) {
	// 		return null;
	// 	}
	// }

	// async changeUserSettings(user: User, userSettingsDto: UserSettingsDto) {
	// 	const userSettings = await this.userSettingsModel.findById(user._id);

	// 	if (userSettings == null) {
	// 		// create new user settings
	// 		const newUserSettings = new this.userSettingsModel({
	// 			_id: user._id,
	// 			interface: userSettingsDto.interface,
	// 			avatarBookmarks: userSettingsDto.avatarBookmarks,
	// 		});
	// 		await newUserSettings.save();
	// 	} else {
	// 		// update user settings
	// 		userSettings.interface = userSettings.avatarBookmarks;
	// 		userSettings.avatarBookmarks = userSettings.avatarBookmarks;
	// 		await userSettings.save();
	// 	}
	// }

	async getLikedDomains(user: User, getDomainsDto: GetDomainsDto) {
		const { page, amount, search } = getDomainsDto;

		await user
			.populate({ path: "domainLikes", populate: { path: "author" } })
			.execPopulate();

		// TODO: user aggregate
		const domainLikes = pagination<Domain>(page, amount, user.domainLikes)
			.data;

		return Promise.all(
			domainLikes.map(async domain => {
				const session = await this.sessionService.findDomainById(
					domain._id,
				);

				return renderDomain(domain, session, user);
			}),
		);
	}

	async getPrivateDomains(user: User, getDomainsDto: GetDomainsDto) {
		const domains = await this.domainService.findPrivateDomains(
			user,
			getDomainsDto,
		);

		return Promise.all(
			domains.map(async domain => {
				const session = await this.sessionService.findDomainById(
					domain._id,
				);

				return renderDomain(domain, session, user);
			}),
		);
	}

	// TODO: replace with actual friends
	async getFriends(user: User) {
		const userSessions = await this.sessionService.userSessionModel
			.find()
			.populate("user")
			.populate("domain");

		return (
			userSessions
				// filter out private users until properly implemented
				.filter(
					session =>
						session.domain && session.domain.restriction !== "acl",
				)
				.map(session => renderFriend(session.user, session))
		);
	}

	async sendVerify(user: User, email: string) {
		if (email == null) throw new BadRequestException();

		if (!mailchecker.isValid(email))
			throw new BadRequestException("Invalid email address");

		if (user.email != email && (await this.findByEmail(email)) != null)
			throw new ConflictException("Email already exists");

		const secret = generateRandomString(32);
		user.emailVerifySecret = secret;
		await user.save();

		const token = this.jwtService.sign(
			{
				id: user.id,
				email,
				secret,
			},
			{
				expiresIn: "1d",
			},
		);

		try {
			this.emailService.sendEmailVerify(user, email, token);
		} catch (err) {
			throw new InternalServerErrorException();
		}
	}

	async sendResetPassword(email: string, req: Request) {
		if (email == null) throw new BadRequestException();

		const user = await this.findByEmail(email);
		if (user == null) throw new NotFoundException("Email not found");
		// if (user.emailVerified === false)
		// 	throw new BadRequestException("Email not verified");

		const secret = generateRandomString(32);
		user.resetPasswordSecret = secret;
		await user.save();

		const token = this.jwtService.sign(
			{
				id: user.id,
				secret,
			},
			{
				expiresIn: "1d",
			},
		);

		try {
			this.emailService.sendResetPassword(user, token, req);
		} catch (err) {
			throw new InternalServerErrorException();
		}
	}

	async verifyUser(token: string) {
		const { id, email, secret } = this.jwtService.verify(token); // will throw if invalid
		if (id == null) throw new BadRequestException();

		const user = await this.findById(id);
		if (user == null) throw new NotFoundException();

		if (user.email !== email && (await this.findByEmail(email)) != null)
			throw new ConflictException("Email already exists");

		if (user.emailVerifySecret === secret) {
			user.email = email;
			user.emailVerified = true;
			user.emailVerifySecret = "";
			await user.save();
		}

		return { user, justVerified: true };
	}

	async resetPasswordTokenToUser(token: string) {
		const { id, secret } = this.jwtService.verify(token); // will throw if invalid
		if (id == null) throw new BadRequestException();

		const user = await this.findById(id);
		if (user == null) throw new NotFoundException();

		if (user.resetPasswordSecret !== secret)
			throw new BadRequestException("Invalid token");

		// because this token was received through email
		user.emailVerified = true;
		user.emailVerifySecret = "";
		await user.save();

		return { user };
	}

	async findUsers(offset = 0, search = "") {
		if (offset < 0) offset = 0;
		const amount = 50;

		let find = {};
		if (search) {
			const queryRegExp = this.regexForFinding(search, false);
			find = {
				$or: [{ username: queryRegExp }, { email: queryRegExp }],
			};
		}

		return this.userModel
			.find(find)
			.sort({ created: -1 })
			.skip(offset)
			.limit(amount);
	}

	async findUsersOnlineSorted(offset = 0, search = "") {
		if (offset < 0) offset = 0;
		const amount = 50;

		let find = {};
		if (search) {
			const queryRegExp = this.regexForFinding(search, false);
			find = {
				$or: [{ username: queryRegExp }, { email: queryRegExp }],
			};
		}

		const sessions = await this.sessionService.userSessionModel
			.find()
			.sort({ minutes: -1 })
			.skip(offset)
			.limit(amount)
			.populate("user");
		return sessions.map(session => session.user);
	}

	async findBannedUsers(offset = 0, search = "") {
		if (offset < 0) offset = 0;
		const amount = 50;

		let find = {};
		if (search) {
			const queryRegExp = this.regexForFinding(search, false);
			find = {
				$or: [{ username: queryRegExp }, { email: queryRegExp }],
			};
		}

		return this.userModel
			.find({ ...find, banned: true })
			.skip(offset)
			.limit(amount);
	}

	// TODO: friends requests implemented with new schema { to, from }

	// private async canSendFriendRequest(currentUser: User, user: User) {
	// 	// check current user
	// 	if (currentUser.friends.includes(user))
	// 		throw new ConflictException(
	// 			"Already friends with " + user.username,
	// 		);
	// 	if (currentUser.friendRequests.includes(user))
	// 		throw new ConflictException(
	// 			user.username + " already sent you a friend request",
	// 		);

	// 	// check user
	// 	if (user.friends.includes(currentUser))
	// 		throw new ConflictException(
	// 			"Already friends with " + user.username,
	// 		);
	// 	if (user.friendRequests.includes(currentUser))
	// 		throw new ConflictException(
	// 			"Already sent a friend request to " + user.username,
	// 		);
	// }

	// async sendFriendRequest(currentUser: User, username: string) {
	// 	// find user and populate
	// 	const user = await this.findByUsername(username)
	// 		.populate("friends")
	// 		.populate("friendRequests");
	// 	if (user == null) throw new NotFoundException("User not found");

	// 	await currentUser
	// 		.populate("friends")
	// 		.populate("friendRequests")
	// 		.execPopulate();

	// 	// check if possible
	// 	await this.canSendFriendRequest(currentUser, user);

	// 	// add current user to user friend requiests
	// 	user.friendRequests.unshift(currentUser);
	// 	await user.save();
	// }

	// async acceptFriendRequest(currentUser: User, username: string) {
	// 	// find user and populate
	// 	const user = await this.findByUsername(username);
	// 	if (user == null) throw new NotFoundException("User not found");

	// 	await currentUser.populate("friendRequests").execPopulate();

	// 	// check if user sent a friend request
	// 	const friendRequestI = currentUser.friendRequests.indexOf(user);
	// 	if (friendRequestI < 0)
	// 		throw new NotFoundException(
	// 			"You don't have a friend request from " + user.username,
	// 		);

	// 	// remove friend request
	// 	currentUser.friendRequests.splice(friendRequestI, 1);

	// 	// become friends!
	// 	currentUser.friends.push(user);
	// 	user.friends.push(currentUser);

	// 	await currentUser.save();
	// 	await user.save();
	// }

	// // will also delete friend request
	// async deleteFriend(currentUser: User, username: string) {}

	async exportAllData(user: User, password: string) {
		user = await this.userModel.findOne(user._id).select("+hash").exec();

		const valid = await bcrypt.compare(password, user.hash);
		if (!valid) throw new UnauthorizedException("Invalid password");

		const zip = new JSZip();
		zip.file("user " + user.id + ".json", JSON.stringify(user, null, 4));

		await user.populate("domains").execPopulate();
		for (const domain of user.domains) {
			zip.file(
				"domain " + domain.id + ".json",
				JSON.stringify(domain, null, 4),
			);

			const {
				buffer,
				contentType,
			} = await this.domainService.getDomainImage(domain.id, true);
			if (buffer)
				zip.file(
					"domain " + domain.id + "." + contentType.split("/").pop(),
					buffer,
				);
		}

		{
			const { buffer, contentType } = await this.getUserImage(
				user.id,
				true,
			);
			if (buffer)
				zip.file(
					"user " + user.id + "." + contentType.split("/").pop(),
					buffer,
				);
		}

		return zip.generateNodeStream({
			compression: "DEFLATE",
			compressionOptions: {
				level: 6, // 1 best speed, 9 best compression
			},
		});
	}
}
