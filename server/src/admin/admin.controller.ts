import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../auth/admin.guard";
import { DomainService } from "../domain/domain.service";
import { SessionService } from "../session/session.service";
import { UserService } from "../user/user.service";
import { VideoStreamService } from "../video-stream/video-stream.service";
import { GetUsersDto } from "./admin.dto";

@Controller("api/admin")
@ApiTags("admin")
export class AdminController {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
		private videoStreamService: VideoStreamService,
		private sessionService: SessionService,
	) {}

	@Get("users")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard())
	async getUsers(@Query() getUsersDto: GetUsersDto) {
		const users = await this.userService.findUsers(getUsersDto);

		return Promise.all(
			users.map(async user => {
				const session = await this.sessionService
					.findUserById(user._id)
					.populate("domain");

				const online = session != null;

				let location = null;
				if (online) {
					if (session.domain != null) {
						const domain = await this.domainService.findById(
							session.domain._id,
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
			// console.log(host.socket.request.connection);
			return {
				id: host.socket.client.id,
				clients: host.clients.map(client => client.socket.client.id),
			};
		});
	}
}
