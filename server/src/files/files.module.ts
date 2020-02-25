import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
	imports: [AuthModule],
	providers: [FilesService],
	exports: [FilesService],
	controllers: [FilesController],
})
export class FilesModule {}
