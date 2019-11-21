import {
	Body,
	Controller,
	Get,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiUseTags, ApiOperation } from "@nestjs/swagger";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { MulterFile } from "../../common/multer-file.model";
import { UserUpdateLocationDto } from "../../user/user.dto";
import { User } from "../../user/user.schema";
import { UserService } from "../../user/user.service";

@ApiUseTags("from hifi")
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
					username: user.username,
					roles,
					// not part of hifi
					id: user._id,
					email: user.email,
					minutes: user.minutes,
				},
			},
		};
	}

	@Get("locker")
	@ApiOperation({ title: "", deprecated: true })
	@UseGuards(MetaverseAuthGuard())
	getLocker(@CurrentUser() user: User) {
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
	@ApiOperation({ title: "", deprecated: true })
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
		if (file == null) return;
		this.userService.setPublicKey(user, file.buffer);
	}

	@Put("location")
	@UseGuards(MetaverseAuthGuard())
	async putLocation(
		@CurrentUser() user: User,
		@Body() userUpdateLocationDto: UserUpdateLocationDto,
	) {
		const session_id = await this.userService.setUserLocation(
			user,
			userUpdateLocationDto,
		);

		return {
			status: "success",
			data: {
				session_id,
			},
		};
	}
}
