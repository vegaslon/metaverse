import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs";
import * as Handlebars from "handlebars";
import * as path from "path";
import Puppeteer from "puppeteer";
import { ReplaySubject } from "rxjs";
import { streamToRx } from "rxjs-stream";
import { take } from "rxjs/operators";
import { UserService } from "../user/user.service";
import fetch from "node-fetch";

@Injectable()
export class PuppeteerService implements OnModuleInit {
	browser$: ReplaySubject<Puppeteer.Browser> = new ReplaySubject();

	constructor(private readonly userService: UserService) {}

	async onModuleInit() {
		// https://github.com/puppeteer/puppeteer/issues/1793
		this.browser$.next(
			await Puppeteer.launch({
				executablePath: process.env.CHROME_BIN || null,
				ignoreHTTPSErrors: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--ignore-certificate-errors",
					"--proxy-server='direct://'",
					"--proxy-bypass-list=*",
				],
				// headless: false,
			}),
		);
	}

	async renderHTML(
		html: string,
		width?: number,
		height?: number,
		waitUntil = false,
	): Promise<Buffer> {
		const browser = await this.browser$.pipe(take(1)).toPromise();

		const page = await browser.newPage();
		page.setViewport({
			width: width != null ? width : 1920,
			height: height != null ? height : 1920,
			deviceScaleFactor: 1,
		});

		await page.setContent(
			html,
			waitUntil ? { waitUntil: "networkidle0" } : {},
		);
		const buffer = await page.screenshot({
			type: "png",
			omitBackground: true,
		});
		page.close();

		return buffer;
	}

	async renderNametag(username: string, admin = false, friend = false) {
		const { stream } = await this.userService.getUserImage(username);
		const buffer = await streamToRx(stream).toPromise();

		const userImage = "data:image/png;base64," + buffer.toString("base64");

		const html = Handlebars.compile(
			fs.readFileSync(
				path.resolve(__dirname, "../../assets/nametag.html"),
				"utf8",
			),
		)({
			username,
			userImage,
			admin,
			friend,
		});

		return this.renderHTML(html, 1024, 128);
	}

	async renderModel(modelUrl: string) {
		const browser = await this.browser$.pipe(take(1)).toPromise();

		const url =
			"file://" + path.resolve(__dirname, "../../assets/3d-render.html");

		const page = await browser.newPage();
		page.setViewport({
			width: 858,
			height: 480,
			deviceScaleFactor: 1,
		});

		await page.goto(url + "?url=" + modelUrl);

		return new Promise(async (resolve, reject) => {
			page.on("error", error => {
				reject(error);
			});

			page.on("console", async log => {
				if (log.text() !== "TIVOLI FINISHED") return;

				const buffer = await page.screenshot({
					type: "jpeg",
				});
				page.close();

				resolve(buffer);
			});
		});
	}
}
