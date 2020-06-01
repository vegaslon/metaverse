import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import { displayPlural } from "./common/utils";
import { DomainService } from "./domain/domain.service";
import { URL as METAVERSE_URL, WORLD_URL } from "./environment";
import { SessionService } from "./session/session.service";

@Controller({
	host: new URL(WORLD_URL).hostname,
})
@ApiTags("world")
export class WorldController {
	constructor(
		private readonly domainService: DomainService,
		private readonly sessionService: SessionService,
	) {}

	private async render(domainId: string) {
		const domain =
			domainId == null
				? null
				: await this.domainService
						.findById(domainId)
						.populate("author");

		let data: any;

		if (domain == null) {
			data = {
				notFound: true,
				url: METAVERSE_URL,
			};
		} else {
			const session = await this.sessionService.findDomainById(domain.id);
			const author = domain.author;

			data = {
				notFound: false,
				id: domain.id,
				name: domain.label,
				online: session != null,
				users:
					session != null
						? displayPlural(session.onlineUsers, "user")
						: "Offline",
				username: author.username,
				worldImage:
					METAVERSE_URL + "/api/domain/" + domain.id + "/image",
				userImage: METAVERSE_URL + "/api/user/" + author.id + "/image",
			};
		}

		return Handlebars.compile(
			fs.readFileSync(
				path.resolve(__dirname, "../assets/world.html"),
				"utf8",
			),
		)(data);
	}

	@Get(":id")
	getWorld(@Param("id") id: string) {
		return this.render(id);
	}

	@Get("*")
	getAny() {
		return this.render(null);
	}
}
