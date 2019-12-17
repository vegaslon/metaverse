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
import { renderDomainForHifi } from "../../common/utils";
import { UpdateDomainDto } from "../../domain/domain.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";

@ApiTags("from hifi")
@Controller("api/v1/domains")
export class DomainsController {
	constructor(private domainService: DomainService) {}

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

		return {
			status: "success",
			data: {
				domains: [renderDomainForHifi(domain)],
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
		if (domain._id != id) throw new ForbiddenException();

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);

		return {
			status: "success",
			domain: renderDomainForHifi(updatedDomain),
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
		if (domain._id != id) throw new ForbiddenException();

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);

		return {
			status: "success",
			domain: renderDomainForHifi(updatedDomain),
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
		if (domain._id != id) throw new ForbiddenException();

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

	// TODO: is this necessary anymore?
	@Get(":id")
	@ApiOperation({ deprecated: true })
	async getDomain(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) {
			throw new NotFoundException();
		}

		return {
			status: "success",
			domain: renderDomainForHifi(domain),
		};
	}
}
