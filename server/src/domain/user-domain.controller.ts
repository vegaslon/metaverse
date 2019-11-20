import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser } from "../auth/user.decorator";
import { renderDomain } from "../common/utils";
import { User } from "../user/user.schema";
import { CreateDomainDto } from "./domain.dto";
import { DomainService } from "./domain.service";

@Controller("api/user")
@ApiUseTags("user")
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

		return {
			status: "success",
			domain: renderDomain(
				domain,
				this.domainService.sessions[domain._id],
			),
		};
	}

	// @Get(":id")
	// getDomain(@Param("id") id: string) {
	// 	console.log(id);
	// }

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
		return user.domains.map(d =>
			renderDomain(d, this.domainService.sessions[d._id]),
		);
	}
}
