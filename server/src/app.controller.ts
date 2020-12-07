import {
	Controller,
	Get,
	Header,
	InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import fetch from "node-fetch";
import * as YAML from "yaml";

async function getRelease(channel: string) {
	const releasesUrl = "https://cdn.tivolicloud.com/releases/";

	const yamlStr = await (
		await fetch(releasesUrl + channel + ".yml?" + Date.now())
	).text();

	const yaml = YAML.parse(yamlStr);
	if (typeof yaml !== "object")
		throw new InternalServerErrorException("Invalid yaml");

	const { version, releaseDate } = yaml;
	const { url, size, sha512 } = yaml.files
		.filter(file =>
			["exe", "dmg", "appimage"].includes(
				file.url.split(".").pop().toLowerCase(),
			),
		)
		.pop();

	return {
		version,
		releaseDate,
		file: {
			url: releasesUrl + url,
			filename: url,
			size,
			sha512,
		},
	};
}

@Controller("api")
@ApiTags("api")
export class AppController {
	readonly calendarUrl =
		"https://calendar.google.com/calendar/ical/emob4ufq80k6t6e515nu9qev5c%40group.calendar.google.com/public/basic.ics";

	constructor() {}

	@Get("releases/latest")
	async getLatest() {
		const release = await getRelease("latest");

		const platforms = {
			windows: release.file,
			macos: (await getRelease("latest-mac")).file,
			linux: (await getRelease("latest-linux")).file,
		};

		return {
			version: release.version,
			releaseDate: release.releaseDate,
			platforms,
		};
	}

	@Get("events")
	@Header("Content-Type", "text/plain")
	async getEvents() {
		const res = await fetch(this.calendarUrl);
		return res.text();
	}

	// @Get("render")
	// async renderModel(@Query("url") modelUrl: string, @Res() res: Response) {
	// 	const buffer = await this.puppeteerService.renderModel(modelUrl);

	// 	res.set("Content-Type", "image/jpeg");
	// 	res.send(buffer);
	// }
}
