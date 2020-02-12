import {
	BadRequestException,
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	OnModuleInit,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { ObjectID } from "bson";
import * as fs from "fs";
import * as mailchecker from "mailchecker";
import { GridFSBucket } from "mongodb";
import { Connection, Model } from "mongoose";
import fetch from "node-fetch";
import * as path from "path";
import * as sharp from "sharp";
import { Readable } from "stream";
import { GetUsersDto } from "../admin/admin.dto";
import { AuthSignUpDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { heartbeat, HeartbeatSession } from "../common/heartbeat";
import { MulterFile } from "../common/multer-file.model";
import {
	generateRandomString,
	pagination,
	patchObject,
	renderDomain,
	renderFriend,
} from "../common/utils";
import { Domain } from "../domain/domain.schema";
import { DomainService } from "../domain/domain.service";
import { EmailService } from "../email/email.service";
import { DEV } from "../environment";
import { UserSettings } from "./user-settings.schema";
import {
	GetUserDomainsLikesDto,
	UserAvailability,
	UserUpdateEmailDto,
	UserUpdateLocation,
	UserUpdateLocationDto,
	UserUpdatePasswordDto,
} from "./user.dto";
import { User } from "./user.schema";
import uuid = require("uuid");

export interface UserSession {
	id: string;
	userId: string;

	minutes: number;

	location: UserUpdateLocation;
}

const defaultUserImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/user-image.jpg"),
);

@Injectable()
export class UserService implements OnModuleInit {
	public images: GridFSBucket;

	constructor(
		// database
		@InjectConnection() private connection: Connection,
		@InjectModel("users") private readonly userModel: Model<User>,
		@InjectModel("users.settings")
		private readonly userSettingsModel: Model<UserSettings>,

		// services
		@Inject(forwardRef(() => DomainService))
		private readonly domainService: DomainService,
		@Inject(forwardRef(() => AuthService))
		private readonly authService: AuthService,

		private readonly jwtService: JwtService,
		private readonly emailService: EmailService,
	) {}

	onModuleInit() {
		this.userModel
			.updateMany({}, { $set: { online: false, onlineMinutes: 0 } })
			.exec();

		this.images = new GridFSBucket(this.connection.db, {
			bucketName: "users.images",
		});
	}

	// current online users keyed with username. this can get big!
	sessions = new Map<string, UserSession & HeartbeatSession>();

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

	// findByUsernameRegex(regexp: RegExp) {
	// 	return this.userModel.findOne({
	// 		username: regexp,
	// 	});
	// }

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
			created: new Date(),
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
	) {
		const { currentPassword, newPassword } = userUpdatePasswordDto;

		const hash = (await this.findById(user.id).select("hash")).hash;

		console.log(currentPassword, newPassword);
		console.log(hash);

		if (await bcrypt.compare(hash, currentPassword))
			throw new ConflictException("Current password is incorrect");

		user.hash = await this.authService.hashPassword(newPassword);
		await user.save();

		return { message: "Password has been changed" };
	}

	async changeUserImage(user: User, file: MulterFile) {
		return new Promise(async (resolve, reject) => {
			await new Promise(resolve => {
				this.images.delete(user.id, err => {
					resolve();
				});
			});

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
					contentType: "image/jpg",
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

	async getUserImage(username: string) {
		const contentType = "image/jpg";

		const returnDefault = () => {
			let read = false;
			const stream = new Readable({
				read() {
					if (read) {
						this.push(null);
					} else {
						read = true;
						this.push(defaultUserImage);
					}
					return;
				},
			});
			return { stream, contentType };
		};

		let user = await this.findByUsername(username);
		if (user == null) user = await this.findById(username);
		if (user == null) return returnDefault();
		if ((await this.images.find({ _id: user._id }).count()) < 1)
			return returnDefault();

		const stream = this.images.openDownloadStream(user._id);
		return { stream, contentType };
	}

	async heartbeatUser(user: User) {
		const wasOnline = this.sessions.has(user.username);

		const session = heartbeat<UserSession>(
			this.sessions,
			user.username,
			session => {
				// initialize
				session.id = uuid();
				session.userId = user._id;
				session.minutes = 0;
				session.location = {
					availability: UserAvailability.none,
					connected: false,
					domain_id: null,
					network_address: "",
					network_port: NaN,
					node_id: null,
					path: "",
					place_id: null,
				};
			},
			async session => {
				// clean up session from domains
				const domainId = session.location.domain_id;
				if (domainId == null) return;

				const domainSession = this.domainService.sessions.get(domainId);
				if (domainSession == null) return;

				delete domainSession.users[user._id];

				// go offline in database
				const offlineUser = await this.findById(user._id);
				offlineUser.online = false;
				offlineUser.onlineMinutes = 0;
				await offlineUser.save();
			},
			1000 * 30, // maybe 15
		);

		// minutes since online
		const minutes = Math.floor(
			(+new Date(Date.now()) - +session._since) / 1000 / 60,
		);

		let updateUser = false;

		// session.minutes needs to be updated
		if (session.minutes < minutes) {
			const minutesToAddToUser = minutes - session.minutes;
			session.minutes = minutes; // sync again

			// update user
			user.minutes += minutesToAddToUser;
			user.onlineMinutes = session.minutes;

			updateUser = true;
		}

		if (!wasOnline) {
			user.online = true;
			updateUser = true;
		}

		if (updateUser) await user.save();

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
		await this.heartbeatUser(user);
		let session = this.sessions.get(user.username);

		patchObject(session.location, userUpdateLocationDto.location);

		// update user in domain
		if (userUpdateLocationDto.location.domain_id) {
			const domainId = userUpdateLocationDto.location.domain_id;

			const domainSession = this.domainService.sessions.get(domainId);
			if (domainSession != null) {
				domainSession.users[user._id] = session;

				// move domain to top in user's likes if it exists
				if ((user.domainLikes as any[]).includes(domainId)) {
					this.domainService.moveLikedDomainToTopForUser(
						user,
						domainId,
					);
				}
			}
		}

		// return session id
		return session.id;
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

	async getDomainLikes(
		user: User,
		getUserDomainsLikesDto: GetUserDomainsLikesDto,
	) {
		const { page, amount, search } = getUserDomainsLikesDto;

		await user
			.populate({ path: "domainLikes", populate: { path: "author" } })
			.execPopulate();

		const domainLikes = pagination<Domain>(page, amount, user.domainLikes)
			.data;

		return domainLikes.map(domain => {
			return renderDomain(domain, user);
		});
	}

	async getFriends(user: User) {
		// TODO: replace with actual friends

		const usernames = [...this.sessions.keys()];

		const friends = [];
		for (const username of usernames) {
			friends.push(
				await renderFriend(username, this, this.domainService),
			);
		}
		return friends;
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

		const verifyString = this.jwtService.sign(
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
			this.emailService.sendVerify(user, email, verifyString);
		} catch (err) {
			throw new InternalServerErrorException();
		}
	}

	async verifyUser(verifyString: string) {
		const { id, email, secret } = this.jwtService.verify(verifyString); // will throw if invalid

		if (id == null) throw new BadRequestException();

		const user = await this.findById(id);
		if (user == null) throw new NotFoundException();

		if (user.email != email && (await this.findByEmail(email)) != null)
			throw new ConflictException("Email already exists");

		if (user.emailVerifySecret == secret) {
			user.email = email;
			user.emailVerified = true;
			user.emailVerifySecret = "";
		}

		await user.save();

		return { user, justVerified: true };
	}

	findUsers(getUsersDto: GetUsersDto) {
		let { page, amount, onlineSorted } = getUsersDto;

		if (page <= 0) page = 1;
		page -= 1;

		if (amount > 50) amount = 50;

		return this.userModel
			.find(onlineSorted ? { online: true } : {})
			.sort({
				created: -1,
				...(onlineSorted ? { onlineMinutes: -1 } : {}),
			})
			.skip(page * amount)
			.limit(amount);
	}

	private async canSendFriendRequest(currentUser: User, user: User) {
		// check current user
		if (currentUser.friends.includes(user))
			throw new ConflictException(
				"Already friends with " + user.username,
			);
		if (currentUser.friendRequests.includes(user))
			throw new ConflictException(
				user.username + " already sent you a friend request",
			);

		// check user
		if (user.friends.includes(currentUser))
			throw new ConflictException(
				"Already friends with " + user.username,
			);
		if (user.friendRequests.includes(currentUser))
			throw new ConflictException(
				"Already sent a friend request to " + user.username,
			);
	}

	async sendFriendRequest(currentUser: User, username: string) {
		// find user and populate
		const user = await this.findByUsername(username)
			.populate("friends")
			.populate("friendRequests");
		if (user == null) throw new NotFoundException("User not found");

		await currentUser
			.populate("friends")
			.populate("friendRequests")
			.execPopulate();

		// check if possible
		await this.canSendFriendRequest(currentUser, user);

		// add current user to user friend requiests
		user.friendRequests.unshift(currentUser);
		await user.save();
	}

	async acceptFriendRequest(currentUser: User, username: string) {
		// find user and populate
		const user = await this.findByUsername(username);
		if (user == null) throw new NotFoundException("User not found");

		await currentUser.populate("friendRequests").execPopulate();

		// check if user sent a friend request
		const friendRequestI = currentUser.friendRequests.indexOf(user);
		if (friendRequestI < 0)
			throw new NotFoundException(
				"You don't have a friend request from " + user.username,
			);

		// remove friend request
		currentUser.friendRequests.splice(friendRequestI, 1);

		// become friends!
		currentUser.friends.push(user);
		user.friends.push(currentUser);

		await currentUser.save();
		await user.save();
	}

	// will also delete friend request
	async deleteFriend(currentUser: User, username: string) {}
}
