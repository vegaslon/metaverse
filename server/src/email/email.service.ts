import { MailerService } from "@nest-modules/mailer";
import { Injectable } from "@nestjs/common";
import { HOSTNAME } from "../environment";
import { User } from "../user/user.schema";

@Injectable()
export class EmailService {
	constructor(private readonly mailerService: MailerService) {}

	async sendUserVerify(user: User, verifyString: string) {
		return this.mailerService.sendMail({
			to: user.email,
			subject: "Verify your new account!",
			template: "user-verify",
			context: {
				username: user.username,
				verifyUrl: HOSTNAME + "/api/user/verify/" + verifyString,
			},
		});
	}
}
