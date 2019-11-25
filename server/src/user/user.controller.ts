import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	Patch,
	Put,
	NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiImplicitFile, ApiUseTags } from "@nestjs/swagger";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser } from "../auth/user.decorator";
import { MulterFile } from "../common/multer-file.model";
import { UserUpdateDto } from "./user.dto";
import { User } from "./user.schema";
import { UserService } from "./user.service";
import { GridFSBucketReadStream } from "mongodb";

const defaultUserImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/user-image.jpg"),
);

@Controller("api/user")
@ApiUseTags("user")
export class UserController {
	constructor(
		private userService: UserService,
		private authService: AuthService,
	) {}

	@Patch("")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async updateUser(
		@CurrentUser() user,
		@Body() userUpdateDto: UserUpdateDto,
	) {
		if (userUpdateDto.email != null) user.email = userUpdateDto.email;

		if (userUpdateDto.password != null) {
			const hash = await this.authService.hashPassword(
				userUpdateDto.password,
			);
			user.hash = hash;
		}

		await user.save();
		return { success: true };
	}

	@Put("image")
	@ApiBearerAuth()
	@ApiImplicitFile({
		name: "image",
		description: "Update user profile picture",
		required: true,
	})
	@UseGuards(MetaverseAuthGuard())
	@UseInterceptors(
		FileInterceptor("image", {
			limits: {
				fileSize: 1000 * 1000 * 8, // 8mb
			},
		}),
	)
	async updateUserImage(
		@CurrentUser() user: User,
		@UploadedFile() file: MulterFile,
	) {
		await this.userService.changeUserImage(user, file);
		return { success: true };
	}

	@Get(":username/image")
	async getUserImage(
		@Param("username") username: string,
		@Res() res: Response,
	) {
		let user = await this.userService.findByUsername(username);
		if (user == null) user = await this.userService.findById(username);

		const stream = this.userService.images.openDownloadStream(user.id);
		res.set("Content-Type", "image/jpg");

		stream.on("data", chunk => {
			res.write(chunk);
		});

		stream.on("error", () => {
			const stream = new Readable();
			stream.push(defaultUserImage);
			stream.push(null);
			stream.pipe(res);
		});

		stream.on("end", () => {
			res.end();
		});
	}
}
