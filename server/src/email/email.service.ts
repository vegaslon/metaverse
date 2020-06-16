import { MailerService } from "@nest-modules/mailer";
import { Injectable } from "@nestjs/common";
import { URL } from "../environment";
import { User } from "../user/user.schema";

@Injectable()
export class EmailService {
	constructor(private readonly mailerService: MailerService) {}

	async sendVerify(user: User, email: string, token: string) {
		return this.mailerService.sendMail({
			to: email,
			subject: "Verify your account",
			template: "email-verify",
			context: {
				username: user.username,
				email,
				verifyUrl: URL + "/api/user/verify/" + token,
			},
		});
	}

	async sendResetPassword(user: User, token: string) {
		return this.mailerService.sendMail({
			to: user.email,
			subject: "Reset your password",
			template: "email-reset-password",
			context: {
				username: user.username,
				email: user.email,
				resetPasswordUrl: URL + "/api/user/reset-password/" + token,
			},
		});
	}
}
