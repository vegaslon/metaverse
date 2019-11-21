import { ValidationPipe } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import { Request, Response } from "express";
import * as helmet from "helmet";
import * as path from "path";
import { AppModule } from "./app.module";
import { DEV } from "./environment";
import { NotFoundExceptionFilter } from "./not-found";
import bodyParser = require("body-parser");

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

	app.use(helmet(), compression());

	app.useGlobalPipes(
		new ValidationPipe({
			//disableErrorMessages: true,
			//dismissDefaultMessages: true,
			validationError: { target: false, value: false },
			transform: true,
		}),
	);

	initFrontend(app);

	initSwagger(app); // while in alpha
	if (DEV) {
		initDebugging(app);
	}

	await app.listen(3000);
}

bootstrap();
