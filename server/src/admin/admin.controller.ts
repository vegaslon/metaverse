import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../auth/admin.guard";
import { UserService } from "../user/user.service";
import { VideoStreamService } from "../video-stream/video-stream.service";

@Controller("api/admin")
@ApiUseTags("admin")
export class AdminController {
	constructor(
		private userService: UserService,
		private videoStreamService: VideoStreamService,
	) {}

	@Get("users")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard())
	async getUsers() {
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
	@UseGuards(AdminAuthGuard())
	getOnlineUsers() {
		return Object.keys(this.userService.sessions).map(username => {
			const { minutes, location, id, userId } = this.userService.sessions[
				username
			];

			return {
				username,
				minutes,
				location,
				id,
				userId,
			};
		});
	}

	@Get("streams")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard())
	getVideoStreams() {
		return this.videoStreamService.hosts.map(host => {
			console.log(host.socket.request.connection);
			return {
				id: host.socket.client.id,
				clients: host.clients.map(client => client.socket.client.id),
			};
		});
	}
}
