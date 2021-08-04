import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import { displayPlural, encodeObjectId } from "./common/utils";
import { DomainService } from "./domain/domain.service";
import { URL as METAVERSE_URL, WORLD_URL } from "./environment";
import { PuppeteerService } from "./puppeteer/puppeteer.service";
import { SessionService } from "./session/session.service";
import { UserService } from "./user/user.service";

@Controller({
	host: new URL(WORLD_URL).hostname,
})
@ApiTags("world")
export class WorldController {
	constructor(
		private readonly userService: UserService,
		private readonly domainService: DomainService,
		private readonly sessionService: SessionService,
		private readonly puppeteerService: PuppeteerService,
	) {}

	private async renderHtml(domainId: string, renderImage = false) {
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
				renderPage: !renderImage,
				url: METAVERSE_URL,
			};
		} else {
			const session = await this.sessionService.findDomainById(domain.id);
			const author = domain.author;

			const worldUrl = WORLD_URL + "/" + encodeObjectId(domain._id);

			data = {
				notFound: false,
				renderPage: !renderImage,
				url: METAVERSE_URL,
				worldUrl,
				openGraphImage: worldUrl + ".png?" + Date.now(),
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
			};

			if (renderImage) {
				{
					const {
						buffer,
						contentType,
					} = await this.domainService.getDomainImage(domain.id);
					data.worldImage = `data:${contentType};base64,${buffer.toString(
						"base64",
					)}`;
				}
				{
					const {
						buffer,
						contentType,
					} = await this.userService.getUserImage(author.id);
					data.userImage = `data:${contentType};base64,${buffer.toString(
						"base64",
					)}`;
				}
			}
		}

		return Handlebars.compile(
			fs.readFileSync(
				path.resolve(__dirname, "../assets/world.html"),
				"utf8",
			),
		)(data);
	}

	private async renderImage(domainId: string) {
		const html = await this.renderHtml(domainId, true);
		return this.puppeteerService.renderHTML(html, 600, 280, false);
	}

	@Get(":id.png")
	async getWorldImage(@Param("id") id: string, @Res() res: Response) {
		const buffer = await this.renderImage(id);
		res.set("Content-Type", "image/png");
		res.send(buffer);
	}

	@Get(":id")
	getWorld(@Param("id") id: string) {
		return this.renderHtml(id, false);
	}

	@Get("*")
	getAny() {
		return this.renderHtml(null);
	}
}
