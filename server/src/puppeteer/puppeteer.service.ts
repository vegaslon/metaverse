import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import * as path from "path";
import Puppeteer from "puppeteer";
import { rejects } from "assert";

@Injectable()
export class PuppeteerService implements OnModuleInit {
	browser: Puppeteer.Browser;

	constructor() {}

	async onModuleInit() {
		// https://github.com/puppeteer/puppeteer/issues/1793

		this.browser = await Puppeteer.launch({
			executablePath: process.env.CHROME_BIN || null,
			// only for root (in docker container)
			args:
				process.getuid && process.getuid() === 0
					? ["--no-sandbox"]
					: [],
		});
	}

	renderHTML(html: string, width?: number, height?: number): Promise<Buffer> {
		return new Promise(async resolve => {
			const page = await this.browser.newPage();
			page.setViewport({
				width: width != null ? width : 1920,
				height: height != null ? height : 1920,
				deviceScaleFactor: 1,
			});

			await page.setContent(html, { waitUntil: "networkidle0" });
			const buffer = await page.screenshot({
				type: "png",
				omitBackground: true,
			});

			resolve(buffer);

			page.close();
		});
	}

	renderNametag(
		username: string,
		displayName: string = null,
		admin = false,
		friend = false,
	) {
		const html = Handlebars.compile(
			fs.readFileSync(
				path.resolve(__dirname, "../../assets/nametag.html"),
				"utf8",
			),
		)({
			displayName: displayName || username,
			avatarUrl: "http://127.0.0.1:3000/api/user/" + username + "/image",
			admin,
			friend,
		});

		return this.renderHTML(html, 1024, 128);
	}

	renderModel(modelUrl: string) {
		const url =
			"file://" + path.resolve(__dirname, "../../assets/3d-render.html");

		return new Promise(async (resolve, reject) => {
			const page = await this.browser.newPage();
			page.setViewport({
				width: 858,
				height: 480,
				deviceScaleFactor: 1,
			});

			await page.goto(url + "?url=" + modelUrl);

			page.on("error", error => {
				reject(error);
			});

			page.on("console", async log => {
				if (log.text() !== "TIVOLI FINISHED") return;

				const buffer = await page.screenshot({
					type: "jpeg",
				});

				resolve(buffer);

				page.close();
			});
		});
	}
}
