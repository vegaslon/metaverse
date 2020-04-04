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

@Controller("api")
@ApiTags("api")
export class AppController {
	constructor(private puppeteerService: PuppeteerService) {}

	@Get("releases/latest")
	async getReleases() {
		const channel = "latest";

		const yamlStr = await (
			await fetch(
				"https://nyc3.digitaloceanspaces.com/tivolicloud/releases/" +
					channel +
					".yml",
			)
		).text();

		const yaml = YAML.parse(yamlStr);
		if (typeof yaml !== "object")
			throw new InternalServerErrorException("Invalid yaml");

		return yaml;
	}

	@Get("render")
	async renderModel(@Query("url") modelUrl: string, @Res() res: Response) {
		const buffer = await this.puppeteerService.renderModel(modelUrl);

		res.set("Content-Type", "image/jpg");
		res.send(buffer);
	}
}
