import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { Request } from "express";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { pagination } from "../../common/utils";
import { HOSTNAME } from "../../environment";
import { User } from "../../user/user.schema";
import { UserService } from "../../user/user.service";
import { DomainService } from "../../domain/domain.service";
import { OptionalAuthGuard } from "../../auth/optional.guard";
import { DomainRestriction, Domain } from "../../domain/domain.schema";
import {
	UsersConnection,
	UsersConnectionsDto,
	UsersConnectionType,
	UsersDto,
	UsersUser,
} from "./users.dto";

@ApiUseTags("from hifi")
@Controller("/api/v1/users")
export class UsersController {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
	) {}

	@Get()
	@ApiBearerAuth()
	@UseGuards(OptionalAuthGuard())
	async getNearbyUsers(
		@CurrentUser() currentUser: User,
		@Query() usersDto: UsersDto,
	) {
		const { filter, per_page, page, a } = usersDto;
		const domainId = usersDto.status;

		if ((currentUser as any) == false) currentUser = null;

		let users: UsersUser[] = [];

		await (async (currentUser: User) => {
			if (domainId == null) return;

			const domain = await this.domainService.findById(domainId);
			if (domain == null) return;

			const domainSession = this.domainService.sessions[domainId];
			if (domainSession == null) return;

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
							// only if user is in domain
							domainSession.users.filter(
								user => user.userId == currentUser.id,
							).length > 0
						)
							showUsers = true;

					break;
			}
			if (showUsers == false) return;

			for (let userSession of domainSession.users) {
				const user = await this.userService.findById(
					userSession.userId,
				);
				if (user == null) return;

				let connection = null;
				if (currentUser != null) {
					if (currentUser.username == user.username)
						connection = UsersConnectionType.self;
				}

				users.push({
					username: user.username,
					online: true,
					connection,
					location: {
						path: userSession.location.path,
						node_id: userSession.location.node_id,
						root: {
							// fill up
						},
					},
					images: {
						hero:
							HOSTNAME + "/api/user/" + user.username + "/image",
						thumbnail:
							HOSTNAME + "/api/user/" + user.username + "/image",
						tiny:
							HOSTNAME + "/api/user/" + user.username + "/image",
					},
				});
			}
		})(currentUser);

		const sliced = pagination(page, per_page, users);

		return {
			status: "success",
			...sliced.info,
			data: {
				users: sliced.data,
			},
		};
	}

	@Get("connections")
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async getConnections(
		@Query() connectionsDto: UsersConnectionsDto,
		@Req() req: Request,
	) {
		const { per_page, page, sort } = connectionsDto;

		// const users = (await this.userService.findAll()).map(user => {
		// 	const session = this.userService.sessions[user.username];

		// 	return {
		// 		username: user.username,
		// 		online: session == null ? false : true,
		// 		connection: UsersConnectionType.connection,
		// 		location:
		// 			session == null
		// 				? {}
		// 				: {
		// 						root: {
		// 							// place name
		// 							name:
		// 								session.location.network_address +
		// 								":" +
		// 								session.location.network_port +
		// 								session.location.path,
		// 						},
		// 				  },
		// 		images: {
		// 			thumbnail:
		// 				HOSTNAME + "/api/user/" + user.username + "/image",
		// 		},
		// 	} as UsersConnection;
		// });

		const users = [];

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
			return {
				status: "fail",
				data: {
					public_key: "there is no public key for that user",
				},
			};
		}
	}
}
