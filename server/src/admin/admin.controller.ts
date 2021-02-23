import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../auth/guards/admin.guard";
import { AuthService } from "../auth/auth.service";
import { DomainService } from "../domain/domain.service";
import { OpenaiService } from "../openai/openai.service";
import { SessionService } from "../session/session.service";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { VideoStreamService } from "../video-stream/video-stream.service";

@Controller("api/admin")
@ApiTags("admin")
export class AdminController {
	constructor(
		private readonly userService: UserService,
		private readonly domainService: DomainService,
		private readonly videoStreamService: VideoStreamService,
		private readonly sessionService: SessionService,
		private readonly authService: AuthService,
		private readonly openaiService: OpenaiService,
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

		const domains = fast
			? user.domains
			: await (async () => {
					await user.populate("domains").execPopulate();
					return user.domains.map(domain => ({
						name: domain.label,
						id: domain.id,
					}));
			  })();

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			emailVerified: user.emailVerified,
			banned: user.banned,
			domains,
			admin: user.admin,
			created: user.created,
			minutes: user.minutes,
			supporter: user.supporter,
			dev: user.dev,
			maxFilesSize: user.maxFilesSize,
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
		const users = await this.userService.findUsersOnlineSorted(
			Number(offset),
			search,
		);
		return Promise.all(
			users.map(async user => this.renderUser(user, true)),
		);
	}

	@Get("users/banned")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async getBannedUsers(
		@Query("offset") offset: number,
		@Query("search") search: string,
	) {
		const users = await this.userService.findBannedUsers(
			Number(offset),
			search,
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

	@Post("user/:id/ban")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async toggleBan(@Param("id") id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.banned = !user.banned;
		await user.save();

		return user.banned;
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

	@Post("user/:id/supporter")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async toggleSupporter(@Param("id") id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.supporter = !user.supporter;
		await user.save();

		return user.supporter;
	}

	@Post("user/:id/dev")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async toggleDev(@Param("id") id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.dev = !user.dev;
		await user.save();

		return user.dev;
	}

	@Put("user/:id/max-files-size")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	async updateMaxFilesSize(
		@Param("id") id: string,
		@Body("maxFilesSize") maxFilesSize: number,
	) {
		if (typeof maxFilesSize != "number")
			throw new BadRequestException("Invalid max files size");

		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.maxFilesSize = maxFilesSize;
		await user.save();

		return { maxFilesSize };
	}

	@Post("openai/create-token")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	createOpenaiToken(@Body() body: { name: string }) {
		return this.openaiService.createToken(body.name);
	}

	@Get("openai/tokens")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	getOpenaiTokens() {
		return this.openaiService.getTokens();
	}

	@Delete("openai/token/:id")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	deleteOpenaiToken(@Param("id") id: string) {
		return this.openaiService.deleteToken(id);
	}

	@Put("openai/token/:id/rename")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	renameOpenaiToken(@Param("id") id: string, @Body() body: { name: string }) {
		return this.openaiService.renameToken(id, body.name);
	}

	@Post("openai/token/:id/refresh")
	@ApiBearerAuth()
	@UseGuards(AdminAuthGuard)
	refreshOpenaiToken(@Param("id") id: string) {
		return this.openaiService.refreshToken(id);
	}
}
