import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { DomainService } from "./domain.service";

const defaultUserImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/domain-image.jpg"),
);

@Controller("api/domain")
@ApiUseTags("domains")
export class DomainController {
	constructor(private domainService: DomainService) {}

	@Get(":id/image")
	async getDomainImage(@Param("id") id: string, @Res() res: Response) {
		let domain = await this.domainService.findById(id);

		const stream = new Readable();
		if (domain == null || domain.image == null) {
			stream.push(defaultUserImage);
		} else {
			stream.push(domain.image);
		}
		stream.push(null);

		res.set({
			"Content-Type": "image/jpg",
			"Content-Length": stream.readableLength,
		});

		stream.pipe(res);
	}
}
