import { HandlebarsAdapter, MailerModule } from "@nest-modules/mailer";
import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EMAIL_USER, EMAIL_PASS, EMAIL_NAME } from "src/environment";
import * as path from "path";
import { UserModule } from "../user/user.module";

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
