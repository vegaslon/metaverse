import {
	ArgumentsHost,
	Catch,
	NotFoundException,
	UnauthorizedException,
} from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request, Response } from "express";
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

@Catch(NotFoundException)
class NotFoundExceptionFilter extends BaseExceptionFilter {
	private readonly filesHost = new URL(FILES_URL).hostname;
	private readonly teaHost = new URL(TEA_URL).hostname;

	catch(exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const req: Request = ctx.getRequest();

		if (
			req.originalUrl.startsWith("/api/") ||
			this.filesHost === req.hostname ||
			this.teaHost === req.hostname
		)
			return super.catch(exception, host);

		const res: Response = ctx.getResponse();

		if (DEV) {
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
	if (!DEV) {
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

	app.useStaticAssets(frontend.browser, {
		index: null,
	});

	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
	app.useGlobalFilters(new UnauthorizedExceptionFilter(httpAdapter));
}
