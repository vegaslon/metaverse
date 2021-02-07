import {
	Body,
	Controller,
	Headers,
	Param,
	Post,
	Res,
	UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth } from "@nestjs/swagger";
import { OpenaiAuthGuard } from "./openai.guard";
import { OpenaiService } from "./openai.service";

@Controller("api/openai")
export class OpenaiController {
	constructor(private readonly openaiService: OpenaiService) {}

	@Post(":engine/completions")
	@ApiBearerAuth()
	@UseGuards(OpenaiAuthGuard)
	async completions(
		@Headers("Authorization") auth: string,
		@Param("engine") engine: string,
		@Body() body: any,
		@Res() res: Response,
	) {
		return this.openaiService.completions(
			auth.replace(/^Bearer /, ""),
			engine,
			body,
			res,
		);
	}

	@Post(":engine/search")
	@ApiBearerAuth()
	@UseGuards(OpenaiAuthGuard)
	async search(
		@Headers("Authorization") auth: string,
		@Param("engine") engine: string,
		@Body() body: any,
		@Res() res: Response,
	) {
		return this.openaiService.search(
			auth.replace(/^Bearer /, ""),
			engine,
			body,
			res,
		);
	}
}
