import { ArgumentsHost, Catch, NotFoundException } from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as domino from "domino";
import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import "zone.js";
import { DEV } from "./environment";

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

if (!DEV) {
	const template = fs.readFileSync(frontend.browserIndex, "utf8");
	const win = domino.createWindow(template);
	global["window"] = win;
	global["navigator"] = win.navigator;
	global["document"] = win.document;
	global["localStorage"] = {
		...win.localStorage,
		...{ getItem: () => {}, setItem: () => {} },
	};
}

@Catch(NotFoundException)
class FrontendRenderFilter extends BaseExceptionFilter {
	catch(exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();

		const req: Request = ctx.getRequest();
		if (req.originalUrl.startsWith("/api/"))
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
