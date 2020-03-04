import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { FILES_URL } from "../environment";
import { FilesHostService } from "./files-host.service";

@Controller({
	host: new URL(FILES_URL).hostname,
})
@ApiTags("user files")
export class FilesHostController {
	constructor(private readonly filesHostService: FilesHostService) {}

	@Get("*")
	getFile(
		@Res() res: Response,
		@Param("0") location: string,
		@Query() query: { [key: string]: string },
	) {
		return this.filesHostService.getFile(res, location, query);
	}
}
