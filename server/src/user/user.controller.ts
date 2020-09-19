import {
	BadGatewayException,
	Body,
	Controller,
	Delete,
	Get,
	InternalServerErrorException,
	Param,
	Post,
	Put,
	Query,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { MetaverseUnverifiedAuthGuard } from "../auth/auth-unverified.guard";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { CurrentUser } from "../auth/user.decorator";
import { MulterFile } from "../common/multer-file.model";
import { GetDomainsDto } from "../domain/domain.dto";
import { URL } from "../environment";
import { PuppeteerService } from "../puppeteer/puppeteer.service";
import {
	UserUpdateEmailDto,
	UserUpdateImageDto,
	UserUpdatePasswordDto,
} from "./user.dto";
import { User } from "./user.schema";
import { UserService } from "./user.service";

@Controller("api/user")
@ApiTags("user")
export class UserController {
	constructor(
		private userService: UserService,
		private authService: AuthService,
		private puppeteerService: PuppeteerService,
	) {}

	@Put("email")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	async updateUserEmail(
		@CurrentUser() user,
		@Body() userUpdateEmailDto: UserUpdateEmailDto,
	) {
		return this.userService.updateUserEmail(user, userUpdateEmailDto);
	}

	@Put("password")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	async updateUserPassword(
		@CurrentUser() user,
		@Body() userUpdatePasswordDto: UserUpdatePasswordDto,
	) {
		return this.userService.updateUserPassword(user, userUpdatePasswordDto);
	}

	@Put("image")
	@ApiBearerAuth()
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		description: "Update user profile picture",
		type: UserUpdateImageDto,
	})
	@UseGuards(MetaverseAuthGuard)
	@UseInterceptors(
		FileInterceptor("image", {
			limits: {
				fileSize: 1000 * 1000 * 16, // 16 MB
			},
		}),
	)
	updateUserImage(
		@CurrentUser() user: User,
		@UploadedFile() file: MulterFile,
	) {
		if (file == null)
			throw new InternalServerErrorException("Image not received");

		return this.userService.changeUserImage(user, file);
	}

	@Delete("image")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	deleteUserImage(@CurrentUser() user: User) {
		return this.userService.deleteUserImage(user);
	}

	@Post("reset-password")
	sendResetPassword(@Body("email") email: string) {
		return this.userService.sendResetPassword(email);
	}

	@Get("reset-password/:token")
	async resetPassword(@Param("token") token: string, @Res() res: Response) {
		const { user } = await this.userService.resetPasswordTokenToUser(token);
		const userToken = this.authService.login(user).access_token;

		res.redirect(URL + "?resetPassword=" + token + "&token=" + userToken);
	}

	@Get(":username/image")
	async getUserImage(
		@Param("username") username: string,
		@Res() res: Response,
	) {
		const { buffer, contentType } = await this.userService.getUserImage(
			username,
		);
		if (buffer == null) throw new BadGatewayException();

		res.set("Content-Type", contentType);
		return res.send(buffer);
	}

	@Get(":username/nametag")
	async getUserNametag(
		@Param("username") username: string,
		@Query("displayName") displayName: string,
		@Query("admin") admin: string,
		@Query("friend") friend: string,
		@Res() res: Response,
	) {
		let user = await this.userService.findByUsername(username);

		if (user == null) {
			user = {
				id: "",
				username: String().padStart(4, String.fromCharCode(0x2800)),
				admin: false,
			} as any;
			admin = null;
			friend = null;
		}

		const buffer = await this.puppeteerService.renderNametag(
			user,
			displayName,
			admin != null,
			friend != null,
		);

		res.set("Content-Type", "image/png");
		res.send(buffer);
	}

	// @Get("settings")
	// @ApiBearerAuth()
	// @UseGuards(MetaverseAuthGuard)
	// async getUserSettings(@CurrentUser() user) {
	// 	const userSettings = await this.userService.getUserSettings(user);
	// 	if (userSettings == null) throw new NotFoundException();

	// 	return {
	// 		interface: userSettings.interface,
	// 		avatarBookmarks: userSettings.avatarBookmarks,
	// 	};
	// }

	// @Put("settings")
	// @ApiBearerAuth()
	// @UseGuards(MetaverseAuthGuard)
	// putUserSettings(
	// 	@CurrentUser() user,
	// 	@Body() userSettingsDto: UserSettingsDto,
	// ) {
	// 	return this.userService.changeUserSettings(user, userSettingsDto);
	// }

	@Get("domains/liked")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	getLikedDomains(
		@CurrentUser() user: User,
		@Query() getDomainsDto: GetDomainsDto,
	) {
		return this.userService.getLikedDomains(user, getDomainsDto);
	}

	@Get("domains/private")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	getPrivateDomains(
		@CurrentUser() user: User,
		@Query() getDomainsDto: GetDomainsDto,
	) {
		return this.userService.getPrivateDomains(user, getDomainsDto);
	}

	@Get("friends")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard)
	getFriends(@CurrentUser() user: User) {
		return this.userService.getFriends(user);
	}

	@Post("verify")
	@ApiBearerAuth()
	@UseGuards(MetaverseUnverifiedAuthGuard)
	sendVerify(@CurrentUser() user: User, @Body("email") email: string) {
		return this.userService.sendVerify(user, email);
	}

	@Get("verify/:token")
	async verifyUser(@Param("token") token: string, @Res() res: Response) {
		const { user, justVerified } = await this.userService.verifyUser(token);

		const userToken = this.authService.login(user).access_token;

		res.redirect(
			URL + (justVerified ? "?emailVerified&token=" + userToken : ""),
		);
	}

	@Get("export-data")
	@ApiBearerAuth()
	@UseGuards(MetaverseUnverifiedAuthGuard)
	async exportAllData(
		@CurrentUser() user: User,
		@Query("password") password: string,
		@Res() res: Response,
	) {
		const stream = await this.userService.exportAllData(user, password);
		res.header("Content-Type", "application/octet-stream");
		stream.pipe(res);
	}
}
