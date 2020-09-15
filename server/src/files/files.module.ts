import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { JWT_SECRET } from "../environment";
import { MetricsModule } from "../metrics/metrics.module";
import { UserModule } from "../user/user.module";
import { FilesHostController } from "./files-host.controller";
import { FilesHostService } from "./files-host.service";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { TeaService } from "./tea.service";
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
		MetricsModule,
	],
	providers: [FilesService, FilesHostService, TeaService],
	exports: [FilesService],
	controllers: [FilesController, FilesHostController],
})
export class FilesModule {
	constructor(
		// make sure it's initialized
		private readonly teaService: TeaService,
	) {}
}
