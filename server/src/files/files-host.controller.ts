import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { FILES_URL, URL as METAVERSE_URL } from "../environment";
import { FilesHostService } from "./files-host.service";

@Controller({
	host: new URL(FILES_URL).hostname,
})
@ApiTags("user files")
export class FilesHostController {
	constructor(private readonly filesHostService: FilesHostService) {}

	@Get("")
	@ApiExcludeEndpoint()
	redirectToUserFile(@Res() res: Response) {
		res.redirect(METAVERSE_URL + "/user/files");
	}

	@Get("*")
	@ApiExcludeEndpoint()
	getFile(
		@Res() res: Response,
		@Param("0") path: string,
		@Query() query: { [key: string]: string },
	) {
		return this.filesHostService.getFile(res, path, query);
	}
}
