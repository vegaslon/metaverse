import {
	Body,
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
		return this.filesService.getFiles(user, "/");
	}

	@Get("status")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	getStatus(@CurrentUser() user: User) {
		return this.filesService.getStatus(user);
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
				fileSize: 1000 * 1000 * 100, // 100 MB
			},
		}),
	)
	uploadFile(
		@CurrentUser() user: User,
		@Body("path") path: string,
		@UploadedFile() file: MulterFile,
	) {
		return this.filesService.uploadFile(user, path, file);
	}

	@Put("folder")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	createFolder(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.createFolder(user, path);
	}

	@Delete("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	deleteFile(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.deleteFile(user, path);
	}

	@Delete("folder")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	deleteFolder(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.deleteFolder(user, path);
	}
}
