import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { JWT_SECRET } from "../environment";
import { UserModule } from "../user/user.module";
import { FilesHostController } from "./files-host.controller";
import { FilesHostService } from "./files-host.service";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { UserFilesCacheSchema } from "./user-files-cache.schema";
import { WebDavService } from "./webdav.service";
import { AuthModule } from "../auth/auth.module";

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
		MongooseModule.forFeature([
			{
				name: "users.files.cache",
				schema: UserFilesCacheSchema,
				collection: "users.files.cache",
			},
		]),
	],
	providers: [FilesService, FilesHostService, WebDavService],
	exports: [FilesService],
	controllers: [FilesController, FilesHostController],
})
export class FilesModule {}
