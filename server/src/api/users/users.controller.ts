import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { HttpException } from "@nestjs/common/exceptions";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { OptionalAuthGuard } from "../../auth/optional.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { pagination } from "../../common/utils";
import { DomainRestriction } from "../../domain/domain.schema";
import { DomainService } from "../../domain/domain.service";
import { HOSTNAME } from "../../environment";
import { User } from "../../user/user.schema";
import { UserService } from "../../user/user.service";
import {
	UsersConnectionType,
	UsersDto,
	UsersLocation,
	UsersUser,
} from "./users.dto";
import { SessionService } from "../../session/session.service";

@ApiTags("from hifi")
@Controller("/api/v1/users")
export class UsersController {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
		private sessionService: SessionService,
	) {}

	private async getNearbyUsers(currentUser: User, domainId: string) {
		let users: UsersUser[] = [];

		if (domainId == null) return users;

		const domain = await this.domainService.findById(domainId);
		if (domain == null) return users;

		const domainSession = await this.sessionService
			.findDomainById(domainId)
			.populate("userSessions");
		if (domainSession == null) return users;

		// logic if allowed to see users in domain
		let showUsers = false;
		switch (domain.restriction) {
			case DomainRestriction.open:
				showUsers = true;
				break;

			case DomainRestriction.hifi:
				if (currentUser != null) showUsers = true;
				break;

			case DomainRestriction.acl:
				if (currentUser != null)
					if (
						// only if logged in user is in domain
						domainSession.userSessions.some(
							userSession => userSession.id == currentUser.id,
						)
					)
						showUsers = true;
				break;
		}
		if (showUsers == false) return users;

		// turning user sessions into UsersUser
		for (let userSession of domainSession.userSessions) {
			const user = await this.userService.findById(userSession.id);
			if (user == null) continue;

			let connection = null;
			if (currentUser != null) {
				if (currentUser.username == user.username)
					connection = UsersConnectionType.self;
			}

			const userImageUrl =
				HOSTNAME + "/api/user/" + user.username + "/image";

			users.push({
				username: user.username,
				online: true,
				connection,
				location: {
					path: userSession.path,
					node_id: userSession.nodeId,
					root: {},
				},
				images: {
					hero: userImageUrl,
					thumbnail: userImageUrl,
					tiny: userImageUrl,
				},
			});
		}

		return users;
	}

	@Get()
	@ApiOperation({
		summary: "Gets all users in an online domain",
	})
	@ApiBearerAuth()
	@UseGuards(OptionalAuthGuard())
	async getUsers(
		@CurrentUser() currentUser: User,
		@Query() usersDto: UsersDto,
	) {
		const { filter, per_page, page, status } = usersDto;

		// passport js sets user to false
		if ((currentUser as any) == false) currentUser = null;

		let users: UsersUser[] = [];

		if (filter == "connections" && status == "online") {
			// not needed
		} else {
			users = await this.getNearbyUsers(currentUser, status);
		}

		const sliced = pagination(page, per_page, users);

		return {
			status: "success",
			...sliced.info,
			data: {
				users: sliced.data,
			},
		};
	}

	// @Get("connections")
	// @ApiOperation({ deprecated: true })
	// @ApiBearerAuth()
	// @UseGuards(MetaverseAuthGuard())
	// async getConnections(@Query() connectionsDto: UsersConnectionsDto) {
	// 	const { per_page, page, sort } = connectionsDto;

	// 	const usernames = [...this.userService.sessions.keys()];
	// 	const sessions = [...this.userService.sessions.values()];

	// 	const users = sessions.map((session, i) => {
	// 		const username = usernames[i];

	// 		return {
	// 			username,
	// 			online: true,
	// 			connection: UsersConnectionType.connection,
	// 			location: {
	// 				root: {
	// 					name: session.location.domain_id,
	// 				},
	// 			},
	// 			images: {
	// 				thumbnail: HOSTNAME + "/api/user/" + username + "/image",
	// 			},
	// 		} as UsersConnection;
	// 	});

	// 	const sliced = pagination(page, per_page, users);

	// 	return {
	// 		status: "success",
	// 		...sliced.info,
	// 		data: {
	// 			users: sliced.data,
	// 		},
	// 	};
	// }

	@Get(":username/public_key")
	async getPublicKey(@Param("username") username: string) {
		const user = await this.userService.findByUsername(username);

		if (user != null && user.publicKey != "") {
			return {
				status: "success",
				data: {
					public_key: user.publicKey,
				},
			};
		} else {
			throw new HttpException(
				{
					status: "fail",
					data: {
						public_key: "there is no public key for that user",
					},
				},
				404,
			);
		}
	}

	@Get(":username/location")
	async getUserLocation(@Param("username") username: string) {
		const NoLocation = () =>
			new HttpException(
				{
					status: "fail",
					data: {
						location: "there is no location for that user",
					},
				},
				404,
			);

		const user = await this.userService.findByUsername(username);
		if (user == null) throw NoLocation();

		const session = await this.sessionService
			.findUserById(user._id)
			.populate("domain");
		if (session == null) throw NoLocation();

		const domain = session.domain;

		// TODO: check whether they're friends or not

		return {
			status: "success",
			data: {
				location: {
					path: session.path,
					node_id: session.nodeId,
					root: {
						id: domain._id,
						name: domain.label,
						domain: {
							id: domain._id,
							network_address: domain.networkAddress,
							network_port: domain.networkPort,
							online: true,
							default_place_name: domain._id,
						},
					},
					online: true,
				} as UsersLocation,
			},
		};
	}
}
