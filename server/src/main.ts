import { ValidationPipe } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response } from "express";
import * as path from "path";
import { AppModule } from "./app.module";
import { NotFoundExceptionFilter } from "./not-found";
import bodyParser = require("body-parser");
import { PRODUCTION } from "./environment";

function initFrontend(app: NestExpressApplication) {
	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new NotFoundExceptionFilter(httpAdapter));
	app.useStaticAssets(path.resolve(__dirname, "../frontend"));
}

function initSwagger(app: NestExpressApplication) {
	const options = new DocumentBuilder()
		.setTitle("Metaverse API")
		.setDescription("The official unofficial implementation")
		.setVersion("indev")
		.addBearerAuth()
		.setSchemes("http", "https")
		.build();

	const document = SwaggerModule.createDocument(app, options);

	app.use("/api.json", (req: Request, res: Response) => {
		res.send(document);
	});
	SwaggerModule.setup("api", app, document);
}

function initDebugging(app: NestExpressApplication) {
	app.use((req: Request, res: Response, next: () => {}) => {
		bodyParser.json()(req, res, () => {
			bodyParser.urlencoded()(req, res, () => {
				console.log(req.method + " " + req.originalUrl);
				console.log(req.headers.authorization);
				console.log(req.body);
				next();
			});
		});
	});
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			//disableErrorMessages: true,
			//dismissDefaultMessages: true,
			validationError: { target: false, value: false },
			transform: true,
		}),
	);

	initFrontend(app);
	initSwagger(app);

	if (!PRODUCTION) {
		initDebugging(app);
	}

	await app.listen(3000);
}

bootstrap();
