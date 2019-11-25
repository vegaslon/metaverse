import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { OptionalAuthGuard } from "../auth/optional.guard";
import { CurrentUser } from "../auth/user.decorator";
import { User } from "../user/user.schema";
import { DomainService } from "./domain.service";

const defaultDomainImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/domain-image.jpg"),
);

@Controller("api")
@ApiUseTags("domains")
export class DomainController {
	constructor(private domainService: DomainService) {}

	@Get("domain/:id/image")
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

	@Get("domains")
	@UseGuards(OptionalAuthGuard())
	async getDomains(@CurrentUser() user: User) {}
}
