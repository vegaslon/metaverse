import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { JWT_SECRET } from "../environment";
import { UserModule } from "../user/user.module";
import { FilesHostController } from "./files-host.controller";
import { FilesHostService } from "./files-host.service";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { MetricsModule } from "../metrics/metrics.module";
// import { UserFilesCacheSchema } from "./user-files-cache.schema";

@Module({
	imports: [
		AuthModule,
		UserModule,
		JwtModule.register({
			secret: JWT_SECRET,
			signOptions: {
				noTimestamp: true,
			},
		}),
		// MongooseModule.forFeature([
		// 	{
		// 		name: "users.files.cache",
		// 		schema: UserFilesCacheSchema,
		// 		collection: "users.files.cache",
		// 	},
		// ]),
		MetricsModule,
	],
	providers: [FilesService, FilesHostService],
	exports: [FilesService],
	controllers: [FilesController, FilesHostController],
})
export class FilesModule {}
