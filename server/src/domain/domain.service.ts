import { ForbiddenException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { CreateDomainDto, UpdateDomainDto } from "./domain.dto";
import { Domain } from "./domain.schema";
import uuid = require("uuid");
import { isUUID } from "validator";
import { derPublicKeyHeader } from "../common/der-public-key-header";
import { pagination } from "../common/pagination";

@Injectable()
export class DomainService {
	constructor(
		@InjectModel("Domain") private readonly domainModel: Model<Domain>,
		private userService: UserService,
	) {}

	getDomainById(id: string) {
		return this.domainModel.findById(id);
	}

	private async findDomainFromUser(user: User, id: string) {
		const userDomains = user.domains as any[];

		if (userDomains.includes(id)) {
			return await this.domainModel.findById(id);
		} else {
			throw new ForbiddenException("Domain not found in user");
		}
	}

	async createDomain(user: User, createDomainDto: CreateDomainDto) {
		const domain = new this.domainModel({
			_id: uuid(),
			label: createDomainDto.domain.label,
		});

		user.domains.push(domain);
		await user.save();

		return await domain.save();
	}

	async updateDomain(
		user: User,
		id: string,
		updateDomainDto: UpdateDomainDto,
	) {
		if (!isUUID(id)) throw new ForbiddenException("Invalid uuid");
		const domain = await this.findDomainFromUser(user, id);

		if (updateDomainDto.domain == null) {
			return domain;
		}

		const dto = updateDomainDto.domain;

		if (dto.ice_server_address != null)
			domain.iceServerAddress = dto.ice_server_address;

		if (dto.automatic_networking != null)
			domain.automaticNetworking = dto.automatic_networking;

		if (dto.network_address != null)
			domain.networkAddress = dto.network_address;

		if (dto.network_port != null) domain.networkPort = dto.network_port;

		if (dto.heartbeat) {
			if (dto.heartbeat.num_users != null)
				domain.onlineUsers = dto.heartbeat.num_users;

			if (dto.heartbeat.num_anon_users != null)
				domain.onlineAnonUsers = dto.heartbeat.num_anon_users;
		}

		// metadata
		if (dto.description != null) domain.description = dto.description;
		if (dto.capacity != null) domain.capacity = dto.capacity;
		if (dto.restricted != null) domain.restricted = dto.restricted;
		if (dto.restriction != null) {
			domain.restricted = dto.restriction != "open";
		}
		if (dto.maturity != null) domain.maturity = dto.maturity;
		if (dto.hosts != null) domain.hosts = dto.hosts;
		if (dto.tags != null) domain.tags = dto.tags;

		// versioning
		if (dto.version != null) domain.version = dto.version;
		if (dto.protocol != null) domain.protocol = dto.protocol;

		return await domain.save();
	}

	async setPublicKey(user: User, id: string, buffer: Buffer) {
		const domain = await this.findDomainFromUser(user, id);

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

	async getAllDomains(page: number, per_page: number) {
		if (page <= 0) page = 1;
		if (per_page > 50) per_page = 50;

		page -= 1;
		return this.domainModel
			.find()
			.sort({ onlineUsers: -1 })
			.limit(per_page)
			.skip(page * per_page);
	}
}
