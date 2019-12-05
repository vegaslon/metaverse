import {
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
	UseGuards,
	Put,
	UseInterceptors,
	UploadedFile,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiBody, ApiConsumes } from "@nestjs/swagger";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser } from "../auth/user.decorator";
import { renderDomain } from "../common/utils";
import { User } from "../user/user.schema";
import {
	CreateDomainDto,
	UpdateDomainDto,
	UpdateDomainImageDto,
} from "./domain.dto";
import { DomainService } from "./domain.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { MulterFile } from "../common/multer-file.model";

@ApiTags("user domains")
@Controller("api/user")
export class UserDomainController {
	constructor(
		private authService: AuthService,
		private domainService: DomainService,
	) {}

	@Post("domain")
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

		return renderDomain(domain, user);
	}

	@Post("domain/:id/token")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async newToken(@CurrentUser() user: User, @Param("id") id: string) {
		if (!(user.domains as any[]).includes(id))
			throw new NotFoundException();

		const domain = await this.domainService.findById(id);
		if (domain == null) throw new NotFoundException();

		const token = await this.authService.newDomainToken(user, domain);
		return { token };
	}

	@Get("domains")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async getAllUserDomains(@CurrentUser() user: User) {
		await user.populate("domains").execPopulate();

		return user.domains.map(domain => {
			return renderDomain(domain, user);
		});
	}

	@Patch("domain/:id")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async updateDomain(
		@CurrentUser() user: User,
		@Param("id") id: string,
		@Body() updateDomainDto: UpdateDomainDto,
	) {
		if (!(user.domains as any[]).includes(id))
			throw new NotFoundException();

		const domain = await this.domainService.findById(id);

		const updatedDomain = await this.domainService.updateDomain(
			domain,
			updateDomainDto,
		);

		return renderDomain(updatedDomain, user);
	}

	@Delete("domain/:id")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async deleteDomain(@CurrentUser() user: User, @Param("id") id: string) {
		if (!(user.domains as any[]).includes(id))
			throw new NotFoundException();

		return this.domainService.deleteDomain(id);
	}

	@Put("domain/:id/image")
	@ApiBearerAuth()
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		description: "Update domain thumbnail",
		type: UpdateDomainImageDto,
	})
	@UseGuards(MetaverseAuthGuard())
	@UseInterceptors(
		FileInterceptor("image", {
			limits: {
				fileSize: 1000 * 1000 * 8, // 8mb
			},
		}),
	)
	async updateDomainImage(
		@CurrentUser() user: User,
		@UploadedFile() file: MulterFile,
		@Param("id") id: string,
	) {
		if (!(user.domains as any[]).includes(id))
			throw new NotFoundException();

		const domain = await this.domainService.findById(id);
		if (domain == null) throw new NotFoundException();

		await this.domainService.changeDomainImage(domain, file);
		return { success: true };
	}
}
