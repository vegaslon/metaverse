import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import sharp from "sharp";
import { displayPlural, encodeObjectId, getAverageColor } from "./common/utils";
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
		let domain = null;
		if (domainId != null) {
			try {
				domain = await this.domainService
					.findById(domainId)
					.populate("author");
			} catch (error) {}
		}

		let data: any;

		if (domain == null) {
			data = {
				notFound: true,
				url: METAVERSE_URL,
			};
		} else {
			const session = await this.sessionService.findDomainById(domain.id);
			const author = domain.author;

			let themeColor = null;
			try {
				const domainImage = await this.domainService.getDomainImage(
					domainId,
				);
				themeColor = await getAverageColor(sharp(domainImage.buffer));
			} catch (error) {
				console.error(error);
			}

			data = {
				notFound: false,
				url: METAVERSE_URL,
				worldUrl: WORLD_URL + "/" + encodeObjectId(domain._id),
				id: domain.id,
				name: domain.label,
				description: domain.description,
				private: domain.restriction === "acl",
				online: session != null,
				users:
					session != null
						? displayPlural(session.onlineUsers, "user")
						: "Offline",
				username: author.username,
				worldImage:
					METAVERSE_URL + "/api/domain/" + domain.id + "/image",
				userImage: METAVERSE_URL + "/api/user/" + author.id + "/image",
				themeColor,
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
