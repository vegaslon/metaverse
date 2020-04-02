import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response } from "express";
import * as helmet from "helmet";
import * as os from "os";
import { AppModule } from "./app.module";
import { DEV, WWW_PATH } from "./environment";
import { initFrontend } from "./frontend";
import bodyParser = require("body-parser");

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
	app.enableCors({
		origin: /^((null)|(file:\/\/))$/i, // null from chrome file://
	});

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

	if (DEV) initDebugLogs(app);

	initSwagger(app);
	initFrontend(app);

	/// www path
	if (WWW_PATH) app.useStaticAssets(WWW_PATH);

	// redirects
	const redirects = {
		"/discord": "https://discord.gg/FhuzTwR",
		"/docs": "https://docs.tivolicloud.com",
	};

	for (const [path, redirect] of Object.entries(redirects)) {
		app.use(path, (_, res: Response) => {
			res.redirect(redirect);
		});
	}

	await app.listen(process.env.PORT || 3000);
}

bootstrap();
