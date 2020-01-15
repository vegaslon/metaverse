import { ValidationPipe } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response } from "express";
import * as helmet from "helmet";
import * as path from "path";
import { AppModule } from "./app.module";
import { DEV, WWW_PATH } from "./environment";
import { NotFoundExceptionFilter } from "./not-found";
import bodyParser = require("body-parser");

function initNonSsrFrontend(app: NestExpressApplication) {
	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
	app.useStaticAssets(path.join(__dirname, "../../frontend/dist/browser"));
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
		initNonSsrFrontend(app); // ssr frontend only in production
	}

	if (WWW_PATH) app.useStaticAssets(WWW_PATH);

	const redirects = {
		"/discord": "https://discord.gg/FhuzTwR",
	};

	for (const [path, redirect] of Object.entries(redirects)) {
		app.use(path, (_, res: Response) => {
			res.redirect(redirect);
		});
	}

	await app.listen(3000);
}

bootstrap();
