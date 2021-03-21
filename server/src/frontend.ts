import {
	ArgumentsHost,
	Catch,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request, Response } from "express";
import * as express from "express";
import expressStaticGzip from "express-static-gzip";
import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import "zone.js";
import { DEV, FILES_URL, TEA_URL, URL as METAVERSE_URL } from "./environment";

// this all needs to be fixed eventually
// using https://github.com/nestjs/ng-universal
// but angular gets easily complcated

const frontend = {
	browser: path.resolve(__dirname, "../../frontend/dist/browser"),
	browserIndex: path.resolve(
		__dirname,
		"../../frontend/dist/browser/index.html",
	),

	serverMain: path.join(__dirname, "../../frontend/dist/server/main.js"),
};

const renderPages = !DEV;
// const renderPages = true;

@Catch(NotFoundException)
class NotFoundExceptionFilter extends BaseExceptionFilter {
	private readonly filesHost = new URL(FILES_URL).hostname;
	private readonly teaHost = new URL(TEA_URL).hostname;

	catch(exception: NotFoundException, host: ArgumentsHost) {
		if ((host.getType() as string) == "graphql") return;

		const ctx = host.switchToHttp();
		const req: Request = ctx.getRequest();

		if (
			req.originalUrl.startsWith("/api/") ||
			this.filesHost === req.hostname ||
			this.teaHost === req.hostname
		)
			return super.catch(exception, host);

		const res: Response = ctx.getResponse();

		if (!renderPages) {
			res.sendFile(frontend.browserIndex);
		} else {
			res.render("index", {
				req,
				// providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
			});
		}
	}
}

@Catch(UnauthorizedException)
class UnauthorizedExceptionFilter extends BaseExceptionFilter {
	catch(exception: UnauthorizedException, host: ArgumentsHost) {
		if ((host.getType() as string) == "graphql") return;

		const ctx = host.switchToHttp();
		const req: Request = ctx.getRequest();

		if (req.originalUrl.startsWith("/auth/sso/")) {
			const res: Response = ctx.getResponse();
			return res.redirect(METAVERSE_URL + "?signIn");
		} else {
			return super.catch(exception, host);
		}
	}
}

export function initFrontend(app: NestExpressApplication) {
	if (renderPages) {
		const {
			ngExpressEngine,
			AppServerModule,
		} = require(frontend.serverMain);

		app.engine(
			"html",
			ngExpressEngine({
				bootstrap: AppServerModule,
			}),
		);

		app.setViewEngine("html");
		app.set("views", frontend.browser);
	}

	const fileExists = (fileExistsPath: string) => {
		try {
			return fs.statSync(fileExistsPath).isFile();
		} catch (err) {
			return false;
		}
	};

	const acceptAvifOrWebp = (req: Request, res: Response, next: () => {}) => {
		const filePath = req.path.replace(/^\//, "");
		if (!/\.(jpe?g|png)$/i.test(filePath)) return next();

		const accept = (req.header("accept") ?? "").toLowerCase();

		if (accept.includes("image/avif")) {
			const avifFilePath = filePath.replace(/\.(jpe?g|png)$/i, ".avif");
			if (fileExists(path.resolve(frontend.browser, avifFilePath))) {
				req.url = req.url.replace(filePath, avifFilePath);
				return next();
			}
		}

		if (accept.includes("image/webp")) {
			const webpFilePath = filePath.replace(/\.(jpe?g|png)$/i, ".webp");
			if (fileExists(path.resolve(frontend.browser, webpFilePath))) {
				req.url = req.url.replace(filePath, webpFilePath);
				return next();
			}
		}

		return next();
	};

	express.static.mime.define({ "image/avif": ["avif"] });
	app.use(
		acceptAvifOrWebp,
		expressStaticGzip(frontend.browser, {
			enableBrotli: true,
			orderPreference: ["br"],
			index: false,
		}),
	);

	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
	app.useGlobalFilters(new UnauthorizedExceptionFilter(httpAdapter));
}
