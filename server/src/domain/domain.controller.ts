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
import * as fs from "fs";
import * as path from "path";
import { SessionService } from "../session/session.service";
import { Readable } from "stream";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { OptionalAuthGuard } from "../auth/optional.guard";
import { CurrentUser } from "../auth/user.decorator";
import { renderDomain } from "../common/utils";
import { User } from "../user/user.schema";
import { GetDomainsDto } from "./domain.dto";
import { DomainService } from "./domain.service";

const defaultDomainImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/domain-image.jpg"),
);

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

		return renderDomain(domain, session, currentUser);
	}

	@Get("domain/:id/image")
	async getDomainImage(@Param("id") id: string, @Res() res: Response) {
		const defaultDomainImageURL = "/api/domain/_/image";

		res.set("Content-Type", "image/jpg");

		if (id == "_") {
			const stream = new Readable();
			stream.push(defaultDomainImage);
			stream.push(null);
			stream.pipe(res);
			return;
		}

		const domain = await this.domainService.findById(id);
		if (domain == null) return res.redirect(defaultDomainImageURL);

		const stream = this.domainService.images.openDownloadStream(domain._id);

		stream.on("data", chunk => {
			res.write(chunk);
		});

		stream.on("error", () => {
			res.redirect(defaultDomainImageURL);
		});

		stream.on("end", () => {
			res.end();
		});
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
