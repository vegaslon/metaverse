import {
	Controller,
	Get,
	Param,
	Res,
	UseGuards,
	Query,
	Post,
	NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { OptionalAuthGuard } from "../auth/optional.guard";
import { CurrentUser } from "../auth/user.decorator";
import { User } from "../user/user.schema";
import { DomainService } from "./domain.service";
import { GetDomainsDto } from "./domain.dto";
import { renderDomain } from "../common/utils";
import { MetaverseAuthGuard } from "src/auth/auth.guard";

const defaultDomainImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/domain-image.jpg"),
);

@Controller("api")
@ApiTags("domains")
export class DomainController {
	constructor(private domainService: DomainService) {}

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
	@UseGuards(OptionalAuthGuard())
	async findOnlineDomains(
		@CurrentUser() user: User,
		@Query() getDomainsDto: GetDomainsDto,
	) {
		const domains = await this.domainService
			.findOnlineDomains(
				getDomainsDto,
				//(user as any) == false,
			)
			.populate("author");

		return domains.map(domain => {
			return renderDomain(domain, user);
		});
	}

	@Get("domains/stats")
	getDomainsStat() {
		return this.domainService.getDomainsStats();
	}

	@Post("domains/:id/like")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async likeDomain(@CurrentUser() user: User, @Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) throw new NotFoundException();

		return this.domainService.likeDomain(user, domain);
	}

	@Post("domains/:id/unlike")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async unlikeDomain(@CurrentUser() user: User, @Param("id") id: string) {
		const domain = await this.domainService.findById(id);
		if (domain == null) throw new NotFoundException();

		return this.domainService.unlikeDomain(user, domain);
	}
}
