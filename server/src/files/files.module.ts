import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
	imports: [AuthModule],
	providers: [FilesService],
	exports: [FilesService],
	controllers: [FilesController],
})
export class FilesModule {}
