import { HandlebarsAdapter, MailerModule } from "@nest-modules/mailer";
import { Module } from "@nestjs/common";
import * as path from "path";
import {
	EMAIL_FROM,
	EMAIL_HOST,
	EMAIL_PASS,
	EMAIL_PORT,
	EMAIL_USER,
} from "../environment";
import { EmailService } from "./email.service";

@Module({
	imports: [
		MailerModule.forRoot({
			// https://nodemailer.com/smtp/
			transport: {
				host: EMAIL_HOST,
				port: parseInt(EMAIL_PORT),
				// 465 uses STARTTLS so force secure, otherwise its already secure
				secure: parseInt(EMAIL_PORT) == 465,
				auth: {
					user: EMAIL_USER,
					pass: EMAIL_PASS,
				},
			},
			defaults: {
				from: EMAIL_FROM,
			},
			template: {
				dir: path.resolve(__dirname, "../../templates"),
				adapter: new HandlebarsAdapter(),
				options: {
					strict: true,
				},
			},
		}),
	],
	providers: [EmailService],
	exports: [EmailService],
})
export class EmailModule {}
