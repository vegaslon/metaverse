import {
	Controller,
	Get,
	InternalServerErrorException,
	Query,
	Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import fetch from "node-fetch";
import * as YAML from "yaml";
import { PuppeteerService } from "./puppeteer/puppeteer.service";

async function getRelease(channel: string) {
	const releasesUrl =
		"https://nyc3.digitaloceanspaces.com/tivolicloud/releases/";

	const yamlStr = await (await fetch(releasesUrl + channel + ".yml")).text();

	const yaml = YAML.parse(yamlStr);
	if (typeof yaml !== "object")
		throw new InternalServerErrorException("Invalid yaml");

	const { version, releaseDate } = yaml;
	const { url, size, sha512 } = yaml.files.pop();

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
	constructor(private puppeteerService: PuppeteerService) {}

	@Get("releases/latest")
	async getLatest() {
		const release = await getRelease("latest");

		const platforms = {
			windows: release.file,
			macos: (await getRelease("latest-mac")).file,
		};

		return {
			version: release.version,
			releaseDate: release.releaseDate,
			platforms,
		};
	}

	// @Get("render")
	// async renderModel(@Query("url") modelUrl: string, @Res() res: Response) {
	// 	const buffer = await this.puppeteerService.renderModel(modelUrl);

	// 	res.set("Content-Type", "image/jpg");
	// 	res.send(buffer);
	// }
}
