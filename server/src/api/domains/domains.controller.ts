import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	NotFoundException,
	Param,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentDomain } from "../../auth/domain.decorator";
import { DomainAuthGuard } from "../../auth/domain.guard";
import { MulterFile } from "../../common/multer-file.model";
import { UpdateDomainDto } from "../../domain/domain.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";
import { DomainSession } from "../../session/session.schema";
import { SessionService } from "../../session/session.service";

function renderDomainForHifi(d: Domain, session: DomainSession) {
	const online = session != null;

	return {
		id: d._id,

		ice_server_address: d.iceServerAddress,
		cloud_domain: false,

		network_address: d.networkAddress,
		network_port: d.networkPort,
		online,

		default_place_name: null,
		owner_places: d.ownerPlaces,
		label: d.label, // tivoli
		author: d.author.username, // tivoli

		description: d.description,
		capacity: d.capacity,
		restriction: d.restriction,
		maturity: d.maturity,
		hosts: d.hosts,
		tags: d.tags,

		version: d.version,
		protocol: d.protocol,

		online_users: online ? session.onlineUsers : 0,
		online_anonymous_users: null,
	};
}

@ApiTags("from hifi")
@Controller("api/v1/domains")
export class DomainsController {
	constructor(
		private domainService: DomainService,
		private sessionService: SessionService,
	) {}

	@Get()
	@ApiOperation({
		summary: "Retrieves the domain from the domain token",
	})
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard())
	async getDomains(@CurrentDomain() domain: Domain) {
		// const docs = await this.domainService.getUserDomains(user);
		// let domains = [];

		// for (let doc of docs) {
		// 	domains.push(renderDomainForHifi(doc));
		// }

		await domain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(domain.id);

		return {
			status: "success",
			data: {
				domains: [renderDomainForHifi(domain, session)],
			},
		};
	}

	@Put(":id")
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard())
	async updateDomain(
		@CurrentDomain() domain: Domain,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		if (domain._id !== id) throw new ForbiddenException();

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);
		await updatedDomain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(
			updatedDomain.id,
		);

		return {
			status: "success",
			domain: renderDomainForHifi(updatedDomain, session),
		};
	}

	@Put(":id/ice_server_address")
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard())
	async updateDomainIceServer(
		@CurrentDomain() domain: Domain,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		if (domain._id !== id) throw new ForbiddenException();

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);
		await updatedDomain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(
			updatedDomain.id,
		);

		return {
			status: "success",
			domain: renderDomainForHifi(updatedDomain, session),
		};
	}

	@Put(":id/public_key")
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard())
	@UseInterceptors(FileInterceptor("public_key"))
	async putDomainPublicKey(
		@CurrentDomain() domain: Domain,
		@Param("id") id: string,
		@UploadedFile() file: MulterFile,
	) {
		if (domain._id !== id) throw new ForbiddenException();

		await this.domainService.setPublicKey(domain, file.buffer);

		return {
			status: "success",
		};
	}

	@Get(":id/public_key")
	async getDomainPublicKey(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);

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

	// TODO: still necessary for domain server
	@Get(":id")
	@ApiOperation({ deprecated: true })
	async getDomain(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) {
			throw new NotFoundException();
		}
		await domain.populate("author").execPopulate();

		const session = await this.sessionService.findDomainById(domain.id);

		return {
			status: "success",
			domain: renderDomainForHifi(domain, session),
		};
	}
}
