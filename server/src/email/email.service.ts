import { MailerService } from "@nest-modules/mailer";
import { Injectable } from "@nestjs/common";
import { URL } from "../environment";
import { User } from "../user/user.schema";

@Injectable()
export class EmailService {
	constructor(private readonly mailerService: MailerService) {}

	async sendVerify(user: User, email: string, verifyString: string) {
		return this.mailerService.sendMail({
			to: email,
			subject: "Verify your account!",
			template: "email-verify",
			context: {
				username: user.username,
				email,
				verifyUrl: URL + "/api/user/verify/" + verifyString,
			},
		});
	}
}
