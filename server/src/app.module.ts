import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminModule } from "./admin/admin.module";
import { ApiDomainsModule } from "./api/domains/domains.module";
import { ApiPlacesModule } from "./api/places/places.module";
import { ApiUserStoriesModule } from "./api/user-stories/user-stories.module";
import { ApiUserModule } from "./api/user/user.module";
import { ApiUsersModule } from "./api/users/users.module";
import { AuthModule } from "./auth/auth.module";
import { DomainModule } from "./domain/domain.module";
import { EmailModule } from "./email/email.module";
import { DB_HOST, DB_NAME, DB_PASS, DB_USER, DEV } from "./environment";
import { PuppeteerModule } from "./puppeteer/puppeteer.module";
import { UserModule } from "./user/user.module";
import { VideoStreamModule } from "./video-stream/video-stream.module";
import { SentryModule } from "@ntegral/nestjs-sentry";

@Module({
	imports: [
		// https://mongoosejs.com/docs/connections.html#options
		MongooseModule.forRoot("mongodb://" + DB_HOST, {
			user: DB_USER,
			pass: DB_PASS,
			dbName: DB_NAME,
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}),

		// only in production
		...(!DEV
			? [
					SentryModule.forRoot({
						dsn:
							"https://35ced4ee7098404393553430f8d78e79@sentry.tivolicloud.com/3",
						environment: "production",
						debug: false,
					}),
			  ]
			: []),

		// angular ssr
		// ...(() => {
		// 	if (DEV) return [];

		// 	// const { ngExpressEngine, AppServerModule } = require(path.join(
		// 	// 	__dirname,
		// 	// 	"../../frontend/dist/server/main.js",
		// 	// ));

		// 	return [
		// 		AngularUniversalModule.forRoot({
		// 			viewsPath: path.resolve(
		// 				__dirname,
		// 				"../../frontend/dist/browser",
		// 			),
		// 			bundle: require(path.join(
		// 				__dirname,
		// 				"../../frontend/dist/server/main.js",
		// 			)),
		// 			liveReload: false,
		// 		}),
		// 	];
		// })(),

		EmailModule,
		PuppeteerModule,

		AuthModule,
		UserModule,
		AdminModule,
		DomainModule,

		ApiUserModule,
		ApiUsersModule,
		ApiUserStoriesModule,
		ApiDomainsModule,
		ApiPlacesModule,

		// extras
		VideoStreamModule,
	],
	providers: [],
	controllers: [],
})
export class AppModule {}
