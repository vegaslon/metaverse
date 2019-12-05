import { Controller, Get, Param, Res, UseGuards, Query } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
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

const defaultDomainImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/domain-image.jpg"),
);

@Controller("api")
@ApiUseTags("domains")
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
	@UseGuards(OptionalAuthGuard())
	async findOnlineDomains(
		@CurrentUser() user: User,
		@Query() getDomainsDto: GetDomainsDto,
	) {
		const domains = await this.domainService
			.findOnlineDomains(
				getDomainsDto.page,
				getDomainsDto.amount,
				(user as any) == false,
			)
			.populate("author");

		return domains.map(domain => {
			return renderDomain(domain, domain.author);
		});
	}

	@Get("domains/stats")
	getDomainsStat() {
		return this.domainService.getDomainsStats();
	}
}
