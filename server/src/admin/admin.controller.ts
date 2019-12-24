import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiResponse } from "@nestjs/swagger";
import { AdminAuthGuard } from "../auth/admin.guard";
import { UserService } from "../user/user.service";
import { VideoStreamService } from "../video-stream/video-stream.service";
import { GetUsersDto } from "./admin.dto";
import { DomainService } from "../domain/domain.service";

@Controller("api/admin")
@ApiTags("admin")
export class AdminController {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
		private videoStreamService: VideoStreamService,
	) {}

	@Get("users")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard())
	async getUsers(@Query() getUsersDto: GetUsersDto) {
		const users = await this.userService.findUsers(getUsersDto);

		return Promise.all(
			users.map(async user => {
				const session = this.userService.sessions.get(user.username);
				const online = session != null;

				let location = null;
				if (online) {
					const domainId = session.location.domain_id;
					if (domainId) {
						const domain = await this.domainService.findById(
							domainId,
						);
						if (domain != null) location = domain.label;
					}
				}

				return {
					online,
					username: user.username,
					email: user.email,
					created: user.created,
					minutes: user.minutes,
					session: online
						? {
								minutes: session.minutes,
								location,
						  }
						: null,
				};
			}),
		);
	}

	// @Get("users/online")
	// @ApiBearerAuth()
	// @UseGuards(AdminAuthGuard())
	// getOnlineUsers() {
	// 	return [...this.userService.sessions.keys()].map(username => {
	// 		const { minutes, location } = this.userService.get(username);

	// 		return {
	// 			username,
	// 			minutes,
	// 			location,
	// 		};
	// 	});
	// }

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
