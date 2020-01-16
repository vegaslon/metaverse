import {
	ArgumentsHost,
	Catch,
	NotFoundException,
	ValidationPipe,
} from "@nestjs/common";
import {
	BaseExceptionFilter,
	HttpAdapterHost,
	NestFactory,
} from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as domino from "domino";
import { Request, Response } from "express";
import * as fs from "fs";
import * as helmet from "helmet";
import * as path from "path";
import "zone.js";
import { AppModule } from "./app.module";
import { DEV, WWW_PATH } from "./environment";
import bodyParser = require("body-parser");

// temporary until nestjs fixes their AngularUniversalModule
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

function initSwagger(app: NestExpressApplication) {
	const options = new DocumentBuilder()
		.setTitle("Metaverse API")
		.setDescription("The official unofficial implementation")
		.setVersion("indev")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, options);

	app.use("/api.json", (req: Request, res: Response) => {
		res.send(document);
	});
	SwaggerModule.setup("api", app, document);
}

function initDebugLogs(app: NestExpressApplication) {
	app.use((req: Request, res: Response, next: () => void) => {
		bodyParser.json()(req, res, () => {
			bodyParser.urlencoded()(req, res, () => {
				console.log(req.method + " " + req.originalUrl);
				console.log("auth: " + req.headers.authorization);
				console.log("body: \n" + JSON.stringify(req.body, null, 4));
				next();
			});
		});
	});
}

@Catch(NotFoundException)
class FrontendRenderFilter extends BaseExceptionFilter {
	catch(exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();

		const req: Request = ctx.getRequest();
		if (req.originalUrl.startsWith("/api/"))
			return super.catch(exception, host);

		const res: Response = ctx.getResponse();

		res.render("index", {
			req,
			//providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
		});
	}
}

function initFrontend(app: NestExpressApplication) {
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

		const { httpAdapter } = app.get(HttpAdapterHost);
		app.useGlobalFilters(new FrontendRenderFilter(httpAdapter));
	}
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	if (!DEV) {
		app.enableCors({
			origin: /^((null)|(file:\/\/))$/i, // null from chrome file://
		});
	}

	app.use(
		helmet(),
		//compression()
	);

	app.useGlobalPipes(
		new ValidationPipe({
			//disableErrorMessages: true,
			//dismissDefaultMessages: true,
			validationError: { target: false, value: false },
			transform: true,
		}),
	);

	if (DEV) {
		initSwagger(app);
		initDebugLogs(app);
	}

	initFrontend(app);

	if (WWW_PATH) app.useStaticAssets(WWW_PATH);

	const redirects = {
		"/discord": "https://discord.gg/FhuzTwR",
		"/docs": "https://docs.tivolicloud.com",
	};

	for (const [path, redirect] of Object.entries(redirects)) {
		app.use(path, (_, res: Response) => {
			res.redirect(redirect);
		});
	}

	await app.listen(3000);
}

bootstrap();
