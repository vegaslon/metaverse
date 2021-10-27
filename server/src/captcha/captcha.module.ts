import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PuppeteerModule } from "../puppeteer/puppeteer.module";
import { CaptchaSchema } from "./captcha.schema";
import { CaptchaService } from "./captcha.service";
import { CaptchaController } from "./captcha.controller";

@Module({
	imports: [
		PuppeteerModule,
		MongooseModule.forFeature([
			{
				name: "captchas",
				schema: CaptchaSchema,
				collection: "captchas",
			},
		]),
	],
	providers: [CaptchaService],
	exports: [CaptchaService],
	controllers: [CaptchaController],
})
export class CaptchaModule {}
