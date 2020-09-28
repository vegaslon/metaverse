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
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { MetaverseUnverifiedAuthGuard } from "../../auth/auth-unverified.guard";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { MulterFile } from "../../common/multer-file.model";
import { SessionService } from "../../session/session.service";
import { UserUpdateLocationDto } from "../../user/user.dto";
import { User } from "../../user/user.schema";
import { UserService } from "../../user/user.service";

@ApiTags("from hifi")
@ApiBearerAuth()
@Controller("api/v1/user")
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly sessionService: SessionService,
	) {}

	@Get("profile")
	@UseGuards(MetaverseUnverifiedAuthGuard)
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
					emailVerified: user.emailVerified,
					minutes: user.minutes,
				},
			},
		};
	}

	@Get("locker")
	@ApiOperation({
		summary: "Doesn't do anything and I don't know what it's purpose is",
	})
	@UseGuards(MetaverseAuthGuard)
	getLocker(@CurrentUser() user: User) {
		return {
			status: "success",
			data: {},
		};
	}

	@Put("heartbeat")
	@UseGuards(MetaverseAuthGuard)
	async heartbeart(@CurrentUser() user: User) {
		const {
			sessionId: session_id,
		} = await this.sessionService.heartbeatUser(user);

		return {
			status: "success",
			data: {
				session_id,
			},
		};
	}

	@Get("friends")
	@ApiOperation({
		summary:
			"Required for the domain server I think. Currently not implmented ",
	})
	@UseGuards(MetaverseAuthGuard)
	getFriends(@CurrentUser() user) {
		return {
			status: "success",
			data: {
				// all friends for domain server, not connections
				friends: [] as string[],
			},
		};
	}

	@Put("public_key")
	@UseGuards(MetaverseAuthGuard)
	@UseInterceptors(FileInterceptor("public_key"))
	putPublicKey(@CurrentUser() user: User, @UploadedFile() file: MulterFile) {
		if (file == null) return;
		this.userService.setPublicKey(user, file.buffer);
	}

	@Put("location")
	@UseGuards(MetaverseAuthGuard)
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
