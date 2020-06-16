import { HandlebarsAdapter, MailerModule } from "@nest-modules/mailer";
import { Module } from "@nestjs/common";
import * as path from "path";
import { EMAIL_NAME, EMAIL_PASS, EMAIL_USER } from "../environment";
import { EmailService } from "./email.service";

@Module({
	imports: [
		MailerModule.forRoot({
			transport: {
				service: "gmail",
				auth: {
					user: EMAIL_USER,
					pass: EMAIL_PASS,
				},
			},
			defaults: {
				from: '"' + EMAIL_NAME + '" <' + EMAIL_USER + ">",
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
