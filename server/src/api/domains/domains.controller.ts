import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Put,
	UseGuards,
	NotImplementedException,
	UseInterceptors,
	UploadedFile,
} from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { CurrentUser } from "../../auth/user.decorator";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CreateDomainDto, UpdateDomainDto } from "../../domain/domain.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";
import { User } from "../../user/user.schema";
import { FileInterceptor } from "@nestjs/platform-express";
import { MulterFile } from "../../common/multer-file.model";
import { writeFileSync } from "fs";

@ApiUseTags("interface api")
@Controller("api/v1/domains")
export class DomainsController {
	constructor(private domainService: DomainService) {}

	renderDomain(d: Domain) {
		return {
			id: d._id,

			ice_server_address: d.iceServerAddress,
			cloud_domain: false,

			network_address: d.networkAddress,
			network_port: d.networkPort,
			online: d.online,

			default_place_name: d.defaultPlaceName,
			owner_places: d.ownerPlaces,
			label: d.label, // probobaly shouldnt

			description: d.description,
			capacity: d.capacity,
			restricted: d.restricted,
			maturity: d.maturity,
			hosts: d.hosts,
			tags: d.tags,

			version: d.version,
			protocol: d.protocol,

			online_users: d.onlineUsers,
			online_anonymous_users: d.onlineAnonUsers,
		};
	}

	@Get()
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async getDomains(@CurrentUser() user: User) {
		const docs = await this.domainService.getUserDomains(user);
		let domains = [];

		for (let doc of docs) {
			domains.push(this.renderDomain(doc));
		}

		return {
			status: "success",
			data: {
				domains,
			},
		};
	}

	@Post()
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async createDomain(
		@CurrentUser() user: User,
		@Body() createDomainDto: CreateDomainDto,
	) {
		const domain = await this.domainService.createDomain(
			user,
			createDomainDto,
		);

		return {
			status: "success",
			domain: this.renderDomain(domain),
		};
	}

	@Post("temporary")
	async createTemporaryDomain() {
		throw new NotImplementedException();
	}

	@Put(":id")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async updateDomain(
		@CurrentUser() user: User,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		const domain = await this.domainService.updateDomain(
			user,
			id,
			updateDomainDto,
		);

		return {
			status: "success",
			domain: this.renderDomain(domain),
		};
	}

	@Put(":id/ice_server_address")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async updateDomainIceServer(
		@CurrentUser() user: User,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		const domain = await this.domainService.updateDomain(
			user,
			id,
			updateDomainDto,
		);

		return {
			status: "success",
			domain: this.renderDomain(domain),
		};
	}

	@Put(":id/public_key")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	@UseInterceptors(FileInterceptor("public_key"))
	async putDomainPublicKey(
		@CurrentUser() user: User,
		@Param("id") id: string,
		@UploadedFile() file: MulterFile,
	) {
		const domain = await this.domainService.setPublicKey(
			user,
			id,
			file.buffer,
		);

		return {
			status: "success",
		};
	}

	@Get(":id/public_key")
	async getDomainPublicKey(@Param("id") id: string) {
		const domain = await this.domainService.getDomainById(id);

		if (domain != null && domain.publicKey != null) {
			return {
				status: "success",
				data: {
					public_key: domain.publicKey,
				},
			};
		} else {
			return {
				status: "fail",
				data: {
					public_key: "there is no public key for that user",
				},
			};
		}
	}

	async updateDomainPublicKey(
		@CurrentUser() user: User,
		@Param("id") id: string,
	) {}

	@Get(":id")
	async getDomain(@Param("id") id: string) {
		const domain = await this.domainService.getDomainById(id);
		if (domain == null) {
			throw new NotFoundException();
		}

		return {
			status: "success",
			domain: this.renderDomain(domain),
		};
	}
}
