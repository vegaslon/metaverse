import { Controller, Get, Param, Res } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { DomainService } from "./domain.service";
import { ObjectId } from "bson";

const defaultDomainImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/domain-image.jpg"),
);

@Controller("api/domain")
@ApiUseTags("domains")
export class DomainController {
	constructor(private domainService: DomainService) {}

	@Get(":id/image")
	async getDomainImage(@Param("id") id: string, @Res() res: Response) {
		const stream = this.domainService.images.openDownloadStream(id as any);
		res.set("Content-Type", "image/jpg");

		stream.on("data", chunk => {
			res.write(chunk);
		});

		stream.on("error", () => {
			const stream = new Readable();
			stream.push(defaultDomainImage);
			stream.push(null);
			stream.pipe(res);
		});

		stream.on("end", () => {
			res.end();
		});
	}
}
