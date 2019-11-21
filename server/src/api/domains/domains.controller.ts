import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	NotFoundException,
	NotImplementedException,
	Param,
	Post,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
	ApiBearerAuth,
	ApiNotImplementedResponse,
	ApiUseTags,
} from "@nestjs/swagger";
import { CurrentDomain } from "../../auth/domain.decorator";
import { DomainAuthGuard } from "../../auth/domain.guard";
import { MulterFile } from "../../common/multer-file.model";
import { renderDomain } from "../../common/utils";
import { UpdateDomainDto } from "../../domain/domain.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";

@ApiUseTags("from hifi")
@Controller("api/v1/domains")
export class DomainsController {
	constructor(private domainService: DomainService) {}

	@Get()
	@ApiBearerAuth()
	@UseGuards(DomainAuthGuard())
	async getDomains(@CurrentDomain() domain: Domain) {
		// const docs = await this.domainService.getUserDomains(user);
		// let domains = [];

		// for (let doc of docs) {
		// 	domains.push(renderDomain(doc));
		// }

		return {
			status: "success",
			data: {
				domains: [
					renderDomain(
						domain,
						this.domainService.sessions[domain._id],
					),
				],
			},
		};
	}

	@Post()
	@ApiBearerAuth()
	@ApiNotImplementedResponse({
		description: "Not implemented because we're using an in-house system",
	})
	async createDomain() {
		throw new NotImplementedException();

		// const domain = await this.domainService.createDomain(
		// 	user,
		// 	createDomainDto,
		// );

		// return {
		// 	status: "success",
		// 	domain: renderDomain(domain),
		// };
	}

	@Post("temporary")
	@ApiNotImplementedResponse({
		description: "Not implemented because we're using an in-house system",
	})
	async createTemporaryDomain() {
		throw new NotImplementedException();
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
			domain: renderDomain(
				updatedDomain,
				this.domainService.sessions[updatedDomain._id],
			),
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
			domain: renderDomain(
				updatedDomain,
				this.domainService.sessions[updatedDomain._id],
			),
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

	@Get(":id")
	async getDomain(@Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) {
			throw new NotFoundException();
		}

		return {
			status: "success",
			domain: renderDomain(
				domain,
				this.domainService.sessions[domain._id],
			),
		};
	}
}
