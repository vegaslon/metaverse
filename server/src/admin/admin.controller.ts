import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../auth/admin.guard";
import { AuthService } from "../auth/auth.service";
import { DomainService } from "../domain/domain.service";
import { SessionService } from "../session/session.service";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { VideoStreamService } from "../video-stream/video-stream.service";

@Controller("api/admin")
@ApiTags("admin")
export class AdminController {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
		private videoStreamService: VideoStreamService,
		private sessionService: SessionService,
		private authService: AuthService,
	) {}

	private async renderUser(user: User, fast = false) {
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

		let domains: any[] = user.domains;
		if (!fast) {
			await user.populate("domains").execPopulate();
			domains = user.domains.map(domain => ({
				name: domain.label,
				id: domain.id,
			}));
		}

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			emailVerified: user.emailVerified,
			domains,
			admin: user.admin,
			created: user.created,
			minutes: user.minutes,
			session: online
				? {
						minutes: session.minutes,
						location,
				  }
				: null,
		};
	}

	@Get("users")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async getUsers(
		@Query("offset") offset: number,
		@Query("search") search: string,
	) {
		const users = await this.userService.findUsers(Number(offset), search);
		return Promise.all(
			users.map(async user => this.renderUser(user, true)),
		);
	}

	@Get("users/online")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async getOnlineUsers(
		@Query("offset") offset: number,
		@Query("search") search: string,
	) {
		const users = await this.userService.findUsers(
			Number(offset),
			search,
			true,
		);
		return Promise.all(
			users.map(async user => this.renderUser(user, true)),
		);
	}

	@Get("streams")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	getVideoStreams() {
		return this.videoStreamService.hosts.map(host => {
			// console.log(host.socket.request.connection);
			return {
				id: host.socket.client.id,
				clients: host.clients.map(client => client.socket.client.id),
			};
		});
	}

	@Post("user/:id/impersonate")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async impersonateUser(@Param("id") id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		return this.authService.login(user);
	}

	@Get("user/:username")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async getUser(@Param("username") username: string) {
		const user = await this.userService.findByIdOrUsername(username);
		if (user == null) throw new NotFoundException("User not found");

		return this.renderUser(user);
	}

	@Post("user/:id/verify")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async toggleVerify(@Param("id") id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.emailVerified = !user.emailVerified;
		user.emailVerifySecret = "";
		await user.save();

		return user.emailVerified;
	}

	@Post("user/:id/admin")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async toggleAdmin(@Param("id") id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.admin = !user.admin;
		await user.save();

		return user.admin;
	}
}
