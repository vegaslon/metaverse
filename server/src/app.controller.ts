import { Controller, Get, InternalServerErrorException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import fetch from "node-fetch";
import * as YAML from "yaml";

@Controller("api")
@ApiTags("api")
export class AppController {
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
}
