import { Controller, Get, Param, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { CaptchaService } from "./captcha.service";

@Controller("api/captcha")
export class CaptchaController {
	constructor(private readonly captchaService: CaptchaService) {}

	@Post()
	generateCaptcha() {
		return this.captchaService.generateCaptcha();
	}

	@Get(":id")
	async getCaptchaImage(@Res() res: Response, @Param("id") id: string) {
		const {
			buffer,
			contentType,
		} = await this.captchaService.getCaptchaImage(id);
		res.set("Content-Type", contentType);
		return res.send(buffer);
	}
}
