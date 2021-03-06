import { MailerService } from "@nest-modules/mailer";
import { Injectable } from "@nestjs/common";
import { Request } from "express";
import * as geoip from "geoip-lite";
import iso_3166_1 from "iso-3166/1.json";
import iso_3166_2 from "iso-3166/2.json";
import { UAParser } from "ua-parser-js";
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
				year: new Date().getFullYear(),
			},
		});
	}

	private getLocationString(ip: string) {
		const ipLookup = geoip.lookup(ip);
		if (ipLookup == null) {
			return "Unknown";
		} else {
			const alpha2 = ipLookup.country;
			const countryLookup = iso_3166_1.find(x => x.alpha2 == alpha2);
			const regionCode = ipLookup.country + "-" + ipLookup.region;
			const regionLookup = iso_3166_2.find(x => x.code == regionCode);

			// city, state, country
			return [
				ipLookup.city.trim(),
				regionLookup == null ? "" : regionLookup.name.trim(),
				countryLookup == null ? "" : countryLookup.name.trim(),
			]
				.filter(x => x != "")
				.join(", ");
		}
	}

	private getIpFromReq(req: Request) {
		const forwardedFor = req.header("X-Forwarded-For");
		const maybeIpv6 = forwardedFor == null ? req.ip : forwardedFor;
		return maybeIpv6.startsWith("::ffff:")
			? maybeIpv6.slice("::ffff:".length)
			: maybeIpv6;
	}

	private getBrowserFromReq(req: Request) {
		const userAgent = req.header("user-agent");
		if (userAgent == null) {
			return "Unknown";
		}

		const result = new UAParser(userAgent).getResult();

		const browser = [
			result.browser.name == null ? "" : result.browser.name,
			result.browser.version == null ? "" : result.browser.version,
		]
			.filter(x => x != "")
			.join(" ");

		const os = [
			result.os.name == null ? "" : result.os.name,
			result.os.version == null ? "" : result.os.version,
		]
			.filter(x => x != "")
			.join(" ");

		const final = [browser, os].filter(x => x != "").join(", ");
		return final == "" ? "Unknown" : final;
	}

	async sendResetPassword(user: User, token: string, req: Request) {
		const ip = this.getIpFromReq(req);
		const location = this.getLocationString(ip);
		const browser = this.getBrowserFromReq(req);

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
}
