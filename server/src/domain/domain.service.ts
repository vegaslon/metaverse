import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
	OnModuleInit,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { GridFSBucket } from "mongodb";
import { Connection, Model } from "mongoose";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { MulterFile } from "../common/multer-file.model";
import { patchDoc, snakeToCamelCaseObject } from "../common/utils";
import { SessionService } from "../session/session.service";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { CreateDomainDto, GetDomainsDto, UpdateDomainDto } from "./domain.dto";
import { Domain } from "./domain.schema";
import uuid = require("uuid");
import sharp = require("sharp");
import escapeString = require("escape-string-regexp");
import { DomainSession } from "../session/session.schema";

// export interface DomainSession {
// 	users: { [id: string]: UserSession };
// }

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

	findById(id: string) {
		try {
			return this.domainModel.findById(id);
		} catch (err) {
			throw new BadRequestException();
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
		if (updateDomainDto.domain == null) {
			return domain;
		}

		if (!allowCrucialOverwrite) {
			// dont want the domain to update crucial info
			delete updateDomainDto.domain.label;
			delete updateDomainDto.domain.description;
			//delete updateDomainDto.domain.path;
		}

		const dto = snakeToCamelCaseObject(updateDomainDto.domain);
		patchDoc(domain, dto);

		if (updateDomainDto.domain.heartbeat) {
			const session = await this.sessionService.heartbeatDomain(domain);

			const heartbeatDto = updateDomainDto.domain.heartbeat;

			if (heartbeatDto.num_users != null)
				if (heartbeatDto.num_users != session.onlineUsers) {
					// move this to sessions?
					domain.lastUpdated = new Date();

					session.onlineUsers = heartbeatDto.num_users;
					await session.save();
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

	findOnlineDomains(getDomainDto: GetDomainsDto, anonymousOnly = false) {
		let { page, amount, search } = getDomainDto;

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
			$and: [{ $or: restrictionQuery }, { $or: searchQuery }],
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
				//.match({ $text: { $search: search } })
				.sort({
					onlineUsers: -1,
					"domain.lastUpdated": -1,
					//score: { $meta: "textScore" },
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

	async deleteDomain(domainId: string) {
		const domain = await this.findById(domainId);
		if (domain == null) throw new NotFoundException();

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
		if (!(user.domainLikes as any[]).includes(domain._id)) {
			// new domains appear at the top
			user.domainLikes.unshift(domain._id);
			await user.save();
		}

		if (!(domain.userLikes as any[]).includes(user._id)) {
			domain.userLikes.push(user._id);
			await domain.save();
		}
	}

	async unlikeDomain(user: User, domain: Domain) {
		if ((user.domainLikes as any[]).includes(domain._id)) {
			const i = user.domainLikes.indexOf(domain._id);
			user.domainLikes.splice(i, 1);
			await user.save();
		}

		if ((domain.userLikes as any[]).includes(user._id)) {
			const i = domain.userLikes.indexOf(user._id);
			domain.userLikes.splice(i, 1);
			await domain.save();
		}
	}

	async moveLikedDomainToTopForUser(user: User, domainId: any) {
		if (!(user.domainLikes as any[]).includes(domainId)) return;

		const i = user.domainLikes.indexOf(domainId);
		user.domainLikes.splice(i, 1);
		user.domainLikes.unshift(domainId);

		await user.save();
	}
}
