import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { HttpException } from "@nestjs/common/exceptions";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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

@ApiTags("from hifi")
@Controller("/api/v1/users")
export class UsersController {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
	) {}

	private async getNearbyUsers(currentUser: User, domainId: string) {
		let users: UsersUser[] = [];

		if (domainId == null) return users;

		const domain = await this.domainService.findById(domainId);
		if (domain == null) return users;

		const domainSession = this.domainService.sessions[domainId];
		if (domainSession == null) return users;

		const domainUserSessions = Object.values(domainSession.users);

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
						domainUserSessions.some(
							user => user.userId == currentUser.id,
						)
					)
						showUsers = true;
				break;
		}
		if (showUsers == false) return users;

		// turning user sessions into UsersUser
		for (let userSession of domainUserSessions) {
			const user = await this.userService.findById(userSession.userId);
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
					path: userSession.location.path,
					node_id: userSession.location.node_id,
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
		const session = this.userService.sessions[username];

		// TODO: check whether they're friends or not

		if (session != null) {
			const location = session.location;
			const domainId = location.domain_id;

			return {
				status: "success",
				data: {
					location: {
						path: location.path,
						node_id: location.node_id,
						root: {
							id: domainId,
							network_address: location.network_address,
							network_port: location.network_port,
							cloud_domain: false,
							online: true,
							default_place_name: domainId,
						},
						online: true,
					} as UsersLocation,
				},
			};
		} else {
			throw new HttpException(
				{
					status: "fail",
					data: {
						location: "there is no location for that user",
					},
				},
				404,
			);
		}
	}
}
