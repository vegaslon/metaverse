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
	BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
	ApiBearerAuth,
	ApiNotImplementedResponse,
	ApiUseTags,
	ApiOperation,
} from "@nestjs/swagger";
import { CurrentDomain } from "../../auth/domain.decorator";
import { DomainAuthGuard } from "../../auth/domain.guard";
import { MulterFile } from "../../common/multer-file.model";
import { renderDomainForHifi } from "../../common/utils";
import { UpdateDomainDto } from "../../domain/domain.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { User } from "../../user/user.schema";

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
		// 	domains.push(renderDomainForHifi(doc));
		// }

		return {
			status: "success",
			data: {
				domains: [renderDomainForHifi(domain)],
			},
		};
	}

	@Post()
	@ApiOperation({ title: "", deprecated: true })
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	@ApiNotImplementedResponse({
		description: "Not implemented because we're using an in-house system",
	})
	async createDomain(@CurrentUser() user: User, @Body() body: any) {
		throw new NotImplementedException();

		// if (body == null) throw new BadRequestException();
		// if (body.domain == null) throw new BadRequestException();
		// if (body.domain.label == null) throw new BadRequestException();

		// const domain = await this.domainService.createDomain(user, {
		// 	label: body.domain.label,
		// });

		// return {
		// 	status: "success",
		// 	domain: renderDomainForHifi(domain, null),
		// };
	}

	@Post("temporary")
	@ApiOperation({ title: "", deprecated: true })
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

	@Get(":id")
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
