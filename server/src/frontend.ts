import { ArgumentsHost, Catch, NotFoundException } from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Request, Response } from "express";
import * as path from "path";
import { URL } from "url";
import "zone.js";
import { DEV, FILES_URL } from "./environment";

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
class FrontendRenderFilter extends BaseExceptionFilter {
	private readonly filesHost = new URL(FILES_URL).hostname;

	catch(exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const req: Request = ctx.getRequest();

		if (req.originalUrl.startsWith("/api/") || this.filesHost == req.host)
			return super.catch(exception, host);

		const res: Response = ctx.getResponse();

		if (DEV) {
			res.sendFile(frontend.browserIndex);
		} else {
			res.render("index", {
				req,
				//providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
			});
		}
	}
}

export function initFrontend(app: NestExpressApplication) {
	if (DEV) {
		app.useStaticAssets(frontend.browser);
	} else {
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

		app.useStaticAssets(frontend.browser, {
			index: null,
		});
	}

	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new FrontendRenderFilter(httpAdapter));
}
