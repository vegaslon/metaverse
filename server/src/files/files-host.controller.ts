import { Controller, Get, Param, Query, Req, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
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
		@Req() req: Request,
		@Res() res: Response,
		@Param("0") path: string,
	) {
		return this.filesHostService.getFile(req, res, path);
	}
}
