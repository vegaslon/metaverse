import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { FilesHostController } from "./files-host.controller";
import { FilesHostService } from "./files-host.service";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { WebDavService } from "./webdav.service";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET } from "../environment";

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
	],
	providers: [FilesService, FilesHostService, WebDavService],
	exports: [FilesService],
	controllers: [FilesController, FilesHostController],
})
export class FilesModule {}
