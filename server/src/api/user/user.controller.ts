import {
	Controller,
	Get,
	UseGuards,
	Put,
	UseInterceptors,
	UploadedFile,
} from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { User } from "../../user/user.schema";
import { UserService } from "../../user/user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { MulterFile } from "../../common/multer-file.model";
import * as fs from "fs";

@ApiUseTags("interface api")
@ApiBearerAuth()
@Controller("api/v1/user")
export class UserController {
	constructor(private userService: UserService) {}

	@Get("profile")
	@UseGuards(MetaverseAuthGuard())
	getProfile(@CurrentUser() user: User) {
		let roles = [];
		if (user.admin) roles.push("admin");

		return {
			status: "success",
			data: {
				user: {
					id: user._id, // not part of hifi
					username: user.username,
					email: user.email, // not part of hifi
					roles,
				},
			},
		};
	}

	@Get("locker")
	@UseGuards(MetaverseAuthGuard())
	getLocker() {
		return {
			status: "success",
			data: {},
		};
	}

	@Put("heartbeat")
	@UseGuards(MetaverseAuthGuard())
	async heartbeart(@CurrentUser() user) {
		const session_id = await this.userService.heartbeat(user);

		return {
			status: "success",
			data: {
				session_id,
			},
		};
	}

	@Get("friends")
	@UseGuards(MetaverseAuthGuard())
	getFriends(@CurrentUser() user) {
		return {
			status: "success",
			data: {
				friends: [] as string[],
			},
		};
	}

	@Put("public_key")
	@UseGuards(MetaverseAuthGuard())
	@UseInterceptors(FileInterceptor("public_key"))
	putPublicKey(@CurrentUser() user: User, @UploadedFile() file: MulterFile) {
		this.userService.setPublicKey(user, file.buffer);
	}
}
