import {
	BadRequestException,
	Injectable,
	NotFoundException,
	OnModuleInit,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { GridFSBucket } from "mongodb";
import { Connection, Model } from "mongoose";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { heartbeat, HeartbeatSession } from "../common/heartbeat";
import { MulterFile } from "../common/multer-file.model";
import { patchDoc, snakeToCamelCaseObject } from "../common/utils";
import { User } from "../user/user.schema";
import { UserService, UserSession } from "../user/user.service";
import { CreateDomainDto, GetDomainsDto, UpdateDomainDto } from "./domain.dto";
import { Domain } from "./domain.schema";
import uuid = require("uuid");
import sharp = require("sharp");
import escapeString = require("escape-string-regexp");

export interface DomainSession {
	users: { [id: string]: UserSession };
}

@Injectable()
export class DomainService implements OnModuleInit {
	// current online domains. this can get big!
	sessions = new Map<string, DomainSession & HeartbeatSession>();

	private userService: UserService;
	public images: GridFSBucket;

	constructor(
		@InjectModel("domains") private readonly domainModel: Model<Domain>,
		@InjectConnection() private connection: Connection,
		private moduleRef: ModuleRef,
	) {
		this.domainModel
			.updateMany(
				{},
				{
					$set: {
						online: false,
						onlineUsers: 0,
						path: "", // not being used at the moment because domain servers handle paths
					},
				},
			)
			.exec();

		this.images = new GridFSBucket(connection.db, {
			bucketName: "domains.thumbnails",
		});
	}

	onModuleInit() {
		this.userService = this.moduleRef.get(UserService, { strict: false });
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
			_id: uuid(),
			author: user,
			label: createDomainDto.label, // required
		});

		patchDoc(domain, createDomainDto);

		user.domains.push(domain);
		await user.save();

		return await domain.save();
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

		const heartbeatDto = updateDomainDto.domain.heartbeat;
		if (heartbeatDto) {
			heartbeat<DomainSession>(
				this.sessions,
				domain._id,
				session => {
					// initialize
					session.users = {};
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

	findOnlineDomains(getDomainDto: GetDomainsDto, anonymousOnly = false) {
		let { page, amount, search } = getDomainDto;

		if (page <= 0) page = 1;
		page -= 1;

		if (amount > 50) amount = 50;

		const restrictionQuery = [
			{ restriction: "open" },
			...(!anonymousOnly ? [{ restriction: "hifi" }] : []),
		];

		const searchRegExp = new RegExp(
			search
				.split(" ")
				.map(word => {
					word = word.trim();
					if (word == "") return null;

					word = word
						.trim()
						.split("")
						.map(char => escapeString(char))
						.join("['\\-_+=#^&]?");

					return "(" + word + ")";
				})
				.filter(word => word != null)
				.join("|"),
			"gi",
		);

		const searchQuery = search
			? [{ label: searchRegExp }, { description: searchRegExp }]
			: [{}];

		return this.domainModel
			.find({
				online: true,
				$and: [{ $or: restrictionQuery }, { $or: searchQuery }],
			})
			.sort({ onlineUsers: -1, lastUpdated: -1 })
			.skip(page * amount)
			.limit(amount);
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
		const onlineUsers = this.userService.sessions.size;
		const onlineDomains = this.sessions.size;

		// const stats = await this.domainModel.aggregate([
		// 	{ $match: { onlineUsers: { $gt: 0 } } },
		// 	{
		// 		$group: {
		// 			_id: null,
		// 			onlineDomainsWithUsers: { $sum: 1 },
		// 		},
		// 	},
		// ]);

		return {
			onlineUsers,
			onlineDomains,
			// onlineDomainsWithUsers:
			// 	stats.length > 0 ? stats[0].onlineDomainsWithUsers : 0,
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
