import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	OnModuleInit,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import fs from "fs";
import { GridFSBucket } from "mongodb";
import { Connection, Model } from "mongoose";
import path from "path";
import sharp from "sharp";
import * as uuid from "uuid";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { MulterFile } from "../common/multer-file.model";
import {
	decodeObjectId,
	docInsideDocArray,
	getMimeType,
	patchDoc,
	snakeToCamelCaseObject,
	streamToBuffer,
	uuidToObjectId,
} from "../common/utils";
import { DomainSession } from "../session/session.schema";
import { SessionService } from "../session/session.service";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { CreateDomainDto, GetDomainsDto, UpdateDomainDto } from "./domain.dto";
import { Domain } from "./domain.schema";
import escapeString = require("escape-string-regexp");

const defaultDomainImagePath = path.resolve(
	__dirname,
	"../../assets/domain-image.jpg",
);
const defaultDomainImage = fs.readFileSync(defaultDomainImagePath);

@Injectable()
export class DomainService implements OnModuleInit {
	// current online domains. this can get big!
	//sessions = new Map<string, DomainSession & HeartbeatSession>();

	public images: GridFSBucket;

	constructor(
		// database
		@InjectConnection() private connection: Connection,
		@InjectModel("domains") private readonly domainModel: Model<Domain>,

		// services
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		@Inject(forwardRef(() => SessionService))
		private readonly sessionService: SessionService,
	) {}

	onModuleInit() {
		this.images = new GridFSBucket(this.connection.db, {
			bucketName: "domains.thumbnails",
		});
	}

	findById(id: ObjectId | string) {
		if (typeof id === "string") {
			if (uuid.validate(id)) {
				return this.domainModel.findById(uuidToObjectId(id));
			} else if (ObjectId.isValid(id)) {
				return this.domainModel.findById(new ObjectId(id));
			} else {
				try {
					return this.domainModel.findById(decodeObjectId(id));
				} catch (err) {
					throw new BadRequestException();
				}
			}
		} else {
			return this.domainModel.findById(id);
		}
	}

	async createDomain(user: User, createDomainDto: CreateDomainDto) {
		if (user.domains.length > 100)
			throw new BadRequestException(
				"You can't make more than 100 domains",
			);

		const domain = new this.domainModel({
			author: user,
			label: createDomainDto.label, // required
		});

		patchDoc(domain, createDomainDto);
		const newDomain = await domain.save();

		user.domains.push(domain);
		await user.save();

		return newDomain;
	}

	async updateDomain(
		domain: Domain,
		updateDomainDto: UpdateDomainDto,
		allowCrucialOverwrite = false,
	) {
		if (updateDomainDto.domain == null) return domain;

		if (!allowCrucialOverwrite) {
			// dont want the domain to update crucial info
			delete updateDomainDto.domain.label;
			delete updateDomainDto.domain.description;
			// delete updateDomainDto.domain.path;
		}

		if (
			updateDomainDto.domain.whitelist &&
			updateDomainDto.domain.whitelist.length > 0
		) {
			const whitelist: User[] = [];

			for (const username of updateDomainDto.domain.whitelist) {
				const user = await this.userService.findByUsername(username);
				if (user == null) continue;
				whitelist.push(user);
			}

			// TODO: dont want to do it like this but im not sure how else
			(domain.whitelist as any) = whitelist;
			delete updateDomainDto.domain.whitelist; // dont use in patchDoc
		}

		const dto = snakeToCamelCaseObject(updateDomainDto.domain);
		patchDoc(domain, dto);

		if (updateDomainDto.domain.heartbeat) {
			const session = await this.sessionService.heartbeatDomain(domain);

			const heartbeatDto = updateDomainDto.domain.heartbeat;

			if (heartbeatDto.num_users != null)
				if (heartbeatDto.num_users !== session.onlineUsers) {
					// move this to sessions?
					domain.lastUpdated = new Date();

					session.onlineUsers = heartbeatDto.num_users;
					await session.save();
				}
		}

		return domain.save();
	}

	async setPublicKey(domain: Domain, buffer: Buffer) {
		const publicKey =
			Buffer.concat([derPublicKeyHeader, buffer])
				.toString("base64")
				.match(/.{1,60}/g)
				.join(" ") + " ";

		domain.publicKey = publicKey;
		return domain.save();
	}

	async getUserDomains(user: User) {
		const userPopulated = await this.userService
			.findById(user.id)
			.populate("domains");

		return userPopulated.domains;
	}

	findOnlineDomains(getDomainDto: GetDomainsDto, anonymousOnly = false) {
		let { page, amount, search, protocol } = getDomainDto;

		if (page <= 0) page = 1;
		page -= 1;

		if (amount > 50) amount = 50;

		const restrictionQuery = [
			{ "domain.restriction": "open" },
			...(anonymousOnly ? [] : [{ "domain.restriction": "hifi" }]),
		];

		// AND = /(?=.*hello)(?=.*world).*/
		// OR  = /((?:hello)|(?:world))/
		const searchRegExp = new RegExp(
			search
				.split(" ")
				.map(word =>
					word.trim() == ""
						? null
						: "(?=.*" +
						  word
								.trim()
								.split("")
								.map(char => escapeString(char))
								.join("['\\-_+=#^&]?") +
						  ")",
				)
				.filter(word => word != null)
				.join("") + ".*",
			"gi",
		);

		const searchQuery = search
			? [
					{ "domain.label": searchRegExp },
					{ "domain.description": searchRegExp },
			  ]
			: [{}];

		const matchArgs = {
			$and: [
				{ $or: restrictionQuery },
				{ $or: searchQuery },
				...(protocol ? [{ "domain.protocol": protocol }] : []),
			],
		};

		return (
			this.sessionService.domainSessionModel
				.aggregate<DomainSession>()
				// populate domain
				.lookup({
					from: "domains",
					localField: "domain",
					foreignField: "_id",
					as: "domain",
				})
				.unwind("$domain")

				// match and paginate
				.match(matchArgs)
				// .match({ $text: { $search: search } })
				.sort({
					onlineUsers: -1,
					"domain.lastUpdated": -1,
					// score: { $meta: "textScore" },
				})
				.skip(page * amount)
				.limit(amount)

				// populate author
				.lookup({
					from: "users",
					localField: "domain.author",
					foreignField: "_id",
					as: "domain.author",
				})
				.unwind("$domain.author")
		);
	}

	findPrivateDomains(user: User, getDomainsDto: GetDomainsDto) {
		let { page, amount } = getDomainsDto;

		if (page <= 0) page = 1;
		page -= 1;

		if (amount > 50) amount = 50;

		return (
			this.domainModel
				.aggregate<Domain>()
				.match({
					whitelist: { $in: [user._id] },
				})
				.skip(page * amount)
				.limit(amount)
				// populate author
				.lookup({
					from: "users",
					localField: "author",
					foreignField: "_id",
					as: "author",
				})
				.unwind("$author")
		);
	}

	changeDomainImage(domain: Domain, file: MulterFile) {
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
				this.images.openUploadStreamWithId(domain._id, null, {
					contentType: "image/jpeg",
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

	async getDefaultDomainImage() {
		// let read = false;
		// const stream = new Readable({
		// 	read() {
		// 		if (read) {
		// 			this.push(null);
		// 		} else {
		// 			read = true;
		// 			this.push(defaultDomainImage);
		// 		}
		// 		return;
		// 	},
		// });
		return {
			buffer: defaultDomainImage,
			contentType: getMimeType(defaultDomainImagePath),
		};
	}

	async getDomainImage(
		id: string,
		onlyUserUploaded = false,
	): Promise<{
		buffer: Buffer;
		contentType: string;
	}> {
		const domain = await this.findById(id);

		if (domain == null)
			return onlyUserUploaded
				? { buffer: null, contentType: null }
				: this.getDefaultDomainImage();

		if ((await this.images.find({ _id: domain._id }).count()) > 0) {
			const stream = this.images.openDownloadStream(domain._id);
			const buffer = await streamToBuffer(stream);
			return { buffer, contentType: "image/jpeg" };
		}

		return onlyUserUploaded
			? { buffer: null, contentType: null }
			: this.getDefaultDomainImage();
	}

	async getDomainsStats() {
		const onlineUsers = await this.sessionService.getUserCount();
		const onlineDomains = await this.sessionService.getDomainCount();

		const stats = await this.sessionService.domainSessionModel.aggregate([
			{ $match: { onlineUsers: { $gt: 0 } } },
			{
				$group: {
					_id: null,
					onlineDomainsWithUsers: { $sum: 1 },
				},
			},
		]);

		return {
			onlineUsers,
			onlineDomains,
			onlineDomainsWithUsers:
				stats.length > 0 ? stats[0].onlineDomainsWithUsers : 0,
		};
	}

	async likeDomain(user: User, domain: Domain) {
		if (!docInsideDocArray(user.domainLikes, domain._id)) {
			user.domainLikes.unshift(domain);
			await user.save();
		}
		if (!docInsideDocArray(domain.userLikes, user._id)) {
			domain.userLikes.unshift(user);
			await domain.save();
		}
	}

	async unlikeDomain(user: User, domain: Domain) {
		if (docInsideDocArray(user.domainLikes, domain._id)) {
			user.domainLikes.pull(domain);
			await user.save();
		}
		if (docInsideDocArray(domain.userLikes, user._id)) {
			domain.userLikes.pull(user);
			await domain.save();
		}
	}

	async moveLikedDomainToTopForUser(user: User, domainId: ObjectId) {
		if (!docInsideDocArray(user.domainLikes, domainId)) return;

		// dont need to move to top if it's already at the top
		if (user.domainLikes.indexOf(domainId) > 0) {
			user.domainLikes.pull(domainId);
			user.domainLikes.unshift(domainId);
			await user.save();
		}
	}
}
