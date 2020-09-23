import { Controller, Get, ImATeapotException, Req, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { TEA_URL } from "../environment";
import { TeaService } from "./tea.service";

@Controller({
	host: new URL(TEA_URL).hostname,
})
@ApiTags("user files over tea")
export class TeaController {
	constructor(private readonly teaService: TeaService) {}

	@Get("*")
	@ApiExcludeEndpoint()
	getFile(@Req() req: Request, @Res() res: Response) {
		try {
			return this.teaService.getFile(req, res);
		} catch (err) {
			throw new ImATeapotException();
		}
	}
}
