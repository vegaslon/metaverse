import {
	Controller,
	Get,
	UseGuards,
	UnauthorizedException,
} from "@nestjs/common";
import { ApiUseTags, ApiBearerAuth } from "@nestjs/swagger";
import { UserService } from "../user/user.service";
import { MetaverseAuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { User } from "../user/user.schema";

@Controller("api/admin")
@ApiUseTags("api")
export class AdminController {
	constructor(private userService: UserService) {}

	@Get("users")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async getUsers(@CurrentUser() user: User) {
		if (!user.admin) throw new UnauthorizedException();

		const users = (await this.userService.findAll()).map(user => {
			return {
				username: user.username,
				email: user.email,
				minutes: user.minutes,
			};
		});

		return users;
	}

	@Get("users/online")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	getOnlineUsers(@CurrentUser() user: User) {
		if (!user.admin) throw new UnauthorizedException();

		let onlineUsers = [];

		const usernames = Object.keys(this.userService.sessions);
		for (let username of usernames) {
			const { minutes, location } = this.userService.sessions[username];

			onlineUsers.push({
				username,
				minutes,
				location,
			});
		}

		return onlineUsers;
	}
}
