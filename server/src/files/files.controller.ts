import {
	Controller,
	Delete,
	Get,
	Put,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { MulterFile } from "../common/multer-file.model";
import { User } from "../user/user.schema";
import { FilesService, UserFileUploadDto } from "./files.service";

@Controller("api/user/files")
@ApiTags("user files")
export class FilesController {
	constructor(private readonly filesService: FilesService) {}

	@Get("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	getFiles(
		@CurrentUser() user: User,
		//@Query("path") path: string
	) {
		return this.filesService.getFiles(user.id, "/");
	}

	@Put("")
	@ApiBearerAuth()
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		description: "File to upload",
		type: UserFileUploadDto,
	})
	@UseGuards(MetaverseAuthGuard())
	@UseInterceptors(
		FileInterceptor("file", {
			limits: {
				fileSize: 1000 * 1000 * 16, // 16 MB
			},
		}),
	)
	updateUserImage(
		@CurrentUser() user: User,
		@Query("path") path: string,
		@UploadedFile() file: MulterFile,
	) {
		return this.filesService.uploadFile(user.id, path, file);
	}

	@Delete("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	deleteFile(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.deleteFile(user.id, path);
	}
}
