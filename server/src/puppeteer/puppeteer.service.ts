import { Injectable, OnModuleInit } from "@nestjs/common";
import * as Puppeteer from "puppeteer";
import * as path from "path";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import { HOSTNAME } from "src/environment";

@Injectable()
export class PuppeteerService implements OnModuleInit {
	browser: Puppeteer.Browser;

	constructor() {}

	async onModuleInit() {
		this.browser = await Puppeteer.launch();
	}

	renderHTML(html: string, width?: number, height?: number): Promise<Buffer> {
		return new Promise(async resolve => {
			const page = await this.browser.newPage();
			page.setViewport({
				width: width != null ? width : 1920,
				height: height != null ? height : 1920,
				deviceScaleFactor: 1,
			});

			page.on("load", async () => {
				const buffer = await page.screenshot({
					type: "png",
					omitBackground: true,
				});

				resolve(buffer);

				page.close();
			});

			page.setContent(html, { waitUntil: "networkidle0" });
		});
	}

	renderNametag(username: string, admin = false, friend = false) {
		const html = Handlebars.compile(
			fs.readFileSync(
				path.resolve(__dirname, "../../assets/nametag.hbs"),
				"utf8",
			),
		)({
			username,
			avatarUrl: HOSTNAME + "/api/user/" + username + "/image",
			admin,
			friend,
		});

		return this.renderHTML(html, 1024, 128);
	}
}
