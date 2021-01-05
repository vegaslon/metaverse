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
	Post,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { MulterFile } from "../common/multer-file.model";
import { User } from "../user/user.schema";
import { FilesService, UserFileUploadDto } from "./files.service";

// for _handleFile
let _filesService: FilesService;

@Controller("api/user/files")
@ApiTags("user files")
export class FilesController {
	constructor(public readonly filesService: FilesService) {
		_filesService = filesService;
	}

	@Get("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	getFiles(
		@CurrentUser() user: User,
		//@Query("path") path: string
	) {
		return this.filesService.getFiles(user, "/");
	}

	@Get("status")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
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
	@UseGuards(MetaverseAuthGuard)
	@UseInterceptors(
		FileInterceptor("file", {
			limits: {
				fileSize: 1000 * 1000 * 100, // 100 MB
			},
			storage: new (function () {
				this._handleFile = (req, file, cb) => {
					_filesService
						.uploadFile(req.user, req.body.path, file)
						.then(data => {
							cb(null, { data });
						})
						.catch(err => {
							cb(err);
						});
				};
			})(),
		}),
	)
	async uploadFile(
		@CurrentUser() user: User,
		@Body("path") path: string,
		@UploadedFile() file: MulterFile & { data: any },
	) {
		return file.data;
	}

	@Put("folder")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	createFolder(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.createFolder(user, path);
	}

	@Delete("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	deleteFile(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.deleteFile(user, path);
	}

	@Delete("folder")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	deleteFolder(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.deleteFolder(user, path);
	}

	@Post("move")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	moveFile(
		@CurrentUser() user: User,
		@Query("oldPath") oldPath: string,
		@Query("newPath") newPath: string,
	) {
		return this.filesService.moveFile(user, oldPath, newPath);
	}

	@Post("folder/move")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	moveFolder(
		@CurrentUser() user: User,
		@Query("oldPath") oldPath: string,
		@Query("newPath") newPath: string,
	) {
		return this.filesService.moveFolder(user, oldPath, newPath);
	}

	@Post("tea-only")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	toggleTeaOnlyFile(@CurrentUser() user: User, @Query("path") path: string) {
		return this.filesService.toggleTeaOnlyFile(user, path);
	}

	@Post("folder/tea-only")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	toggleTeaOnlyFolder(
		@CurrentUser() user: User,
		@Query("path") path: string,
	) {
		return this.filesService.toggleTeaOnlyFolder(user, path);
	}

	// @Post("folder/move")
	// @ApiBearerAuth()
	// @UseGuards(MetaverseAuthGuard)
	// moveFolder(
	// 	@CurrentUser() user: User,
	// 	@Query("oldPath") oldPath: string,
	// 	@Query("newPath") newPath: string,
	// ) {
	// 	//return this.filesService.moveFile(user, oldPath, newPath);
	// }

	@Post("ready-player-me")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	readyPlayerMe(
		@CurrentUser() user: User,
		@Body("name") name: string,
		@Body("avatarUrl") avatarUrl: string,
	) {
		return this.filesService.readyPlayerMe(user, name, avatarUrl);
	}
}
