import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminModule } from "./admin/admin.module";
import { ApiDomainsModule } from "./api/domains/domains.module";
import { ApiUserStoriesModule } from "./api/user-stories/user-stories.module";
import { ApiUserModule } from "./api/user/user.module";
import { ApiUsersModule } from "./api/users/users.module";
import { AuthModule } from "./auth/auth.module";
import { DomainModule } from "./domain/domain.module";
import { DB_HOST, DB_NAME, DB_PASS, DB_USER } from "./environment";
import { UserModule } from "./user/user.module";
import { VideoStreamModule } from "./video-stream/video-stream.module";

@Module({
	imports: [
		// SentryModule.forRoot({
		// 	dsn: "https://4fb2a3460640491bb5f8751c1d538619@sentry.io/1813272",
		// 	debug: true,
		// 	environment: "dev",
		// }),
		// https://mongoosejs.com/docs/connections.html#options
		MongooseModule.forRoot("mongodb://" + DB_HOST, {
			user: DB_USER,
			pass: DB_PASS,
			dbName: DB_NAME,
			useNewUrlParser: true,
			useUnifiedTopology: true,
		}),
		AuthModule,
		UserModule,
		AdminModule,
		DomainModule,

		ApiUserModule,
		ApiUsersModule,
		ApiUserStoriesModule,
		ApiDomainsModule,

		// extras
		VideoStreamModule,
	],
	providers: [],
	controllers: [],
})
export class AppModule {
	constructor() {}
}
