import { MailerService } from "@nest-modules/mailer";
import { Injectable } from "@nestjs/common";
import { Request } from "express";
import {
	getBrowserFromReq,
	getIpFromReq,
	getLocationString,
} from "../common/utils";
import { URL } from "../environment";
import { User } from "../user/user.schema";

@Injectable()
export class EmailService {
	constructor(private readonly mailerService: MailerService) {}

	async sendEmailVerify(user: User, email: string, token: string) {
		return this.mailerService.sendMail({
			to: email,
			subject: "Verify your account",
			template: "email-verify",
			context: {
				username: user.username,
				email,
				verifyUrl: URL + "/api/user/verify/" + token,
				year: new Date().getFullYear(),
			},
		});
	}

	async sendResetPassword(user: User, token: string, req: Request) {
		const ip = getIpFromReq(req);
		const location = getLocationString(ip);
		const browser = getBrowserFromReq(req);

		return this.mailerService.sendMail({
			to: user.email,
			subject: "Reset your password",
			template: "email-reset-password",
			context: {
				username: user.username,
				location: location + " (" + ip + ")",
				browser: browser,
				email: user.email,
				resetPasswordUrl: URL + "/api/user/reset-password/" + token,
				year: new Date().getFullYear(),
			},
		});
	}

	async sendPasswordChanged(user: User, req: Request) {
		const ip = getIpFromReq(req);
		const location = getLocationString(ip);
		const browser = getBrowserFromReq(req);

		return this.mailerService.sendMail({
			to: user.email,
			subject: "Password changed",
			template: "email-password-changed",
			context: {
				username: user.username,
				location: location + " (" + ip + ")",
				browser: browser,
				year: new Date().getFullYear(),
			},
		});
	}
}
