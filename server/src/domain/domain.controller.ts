import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Query,
	Res,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional.guard";
import { CurrentUser } from "../auth/user.decorator";
import { renderDomain } from "../common/utils";
import { SessionService } from "../session/session.service";
import { User } from "../user/user.schema";
import { GetDomainsDto } from "./domain.dto";
import { DomainService } from "./domain.service";

@Controller("api")
@ApiTags("domains")
export class DomainController {
	constructor(
		private domainService: DomainService,
		private sessionService: SessionService,
	) {}

	@Get("domain/:id")
	@ApiBearerAuth()
	@UseGuards(OptionalAuthGuard)
	async getDomain(@CurrentUser() currentUser: User, @Param("id") id: string) {
		const domain = await this.domainService.findById(id).populate("author");
		if (domain == null) throw new NotFoundException();

		const session = await this.sessionService.findDomainById(domain.id);

		const renderedDomain = renderDomain(domain, session, currentUser);
		if (renderedDomain == null) {
			throw new NotFoundException();
		} else {
			return renderedDomain;
		}
	}

	@Get("domain/:id/image")
	async getUserImage(@Param("id") id: string, @Res() res: Response) {
		const response = await this.domainService.getDomainImage(id);

		res.set("Content-Type", response.contentType);
		if (response.stream) return response.stream.pipe(res);
	}

	@Get("domains")
	@ApiBearerAuth()
	@UseGuards(OptionalAuthGuard)
	async findOnlineDomains(
		@CurrentUser() currentUser: User,
		@Query() getDomainsDto: GetDomainsDto,
	) {
		const domainSessions = await this.domainService.findOnlineDomains(
			getDomainsDto,
			// currentUser == null,
		);

		return domainSessions.map(session =>
			renderDomain(session.domain, session, currentUser),
		);
	}

	@Get("domains/stats")
	getDomainsStat() {
		return this.domainService.getDomainsStats();
	}

	@Post("domains/:id/like")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	async likeDomain(@CurrentUser() user: User, @Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) throw new NotFoundException();

		return this.domainService.likeDomain(user, domain);
	}

	@Post("domains/:id/unlike")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	async unlikeDomain(@CurrentUser() user: User, @Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) throw new NotFoundException();

		return this.domainService.unlikeDomain(user, domain);
	}
}
