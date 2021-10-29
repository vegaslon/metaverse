import {
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { readFileSync } from "fs";
import { Model } from "mongoose";
import path from "path";
import { generateRandomString } from "../common/utils";
import { URL as METAVERSE_URL } from "../environment";
import { PuppeteerService } from "../puppeteer/puppeteer.service";
import { Captcha } from "./captcha.schema";

const captchaHtml = readFileSync(
	path.resolve(__dirname, "../../assets/captcha.html"),
	"utf8",
);

@Injectable()
export class CaptchaService {
	constructor(
		@Inject(forwardRef(() => PuppeteerService))
		private readonly puppeteerService: PuppeteerService,
		@InjectModel("captchas")
		private readonly captchaModel: Model<Captcha>,
	) {}

	async generateCaptcha() {
		const {
			buffer,
			result,
		} = await this.puppeteerService.renderHTMLExpectLog(
			captchaHtml,
			256,
			96,
			false,
		);

		const captcha = new this.captchaModel({
			image: buffer,
			result,
		});
		await captcha.save();

		const imageUrl = METAVERSE_URL + "/api/captcha/" + captcha.id;

		return { id: captcha.id, imageUrl };
	}

	async getCaptchaImage(id: string) {
		const captcha = await this.captchaModel.findById(id);
		if (captcha == null) throw new NotFoundException();
		return { buffer: captcha.image, contentType: "image/png" };
	}

	async validateCaptchaAndDelete(id: string, result: string) {
		const captcha = await this.captchaModel.findById(id);
		if (captcha == null) return false;
		const valid = captcha.result == result.trim();
		await captcha.deleteOne();
		return valid;
	}
}
