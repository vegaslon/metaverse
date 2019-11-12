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

const defaultUserImage = fs.readFileSync(
	path.resolve(__dirname, "../../assets/user-image.jpg"),
);

@Controller("api/user")
@ApiUseTags("api")
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

	@Get(":id/image")
	async getUserImage(@Param("id") id: string, @Res() res: Response) {
		const user = await this.userService.findById(id);

		const stream = new Readable();
		if (user == null || user.image == null) {
			stream.push(defaultUserImage);
		} else {
			stream.push(user.image);
		}
		stream.push(null);

		res.set({
			"Content-Type": "image/jpg",
			"Content-Length": stream.readableLength,
		});

		stream.pipe(res);
	}
}
