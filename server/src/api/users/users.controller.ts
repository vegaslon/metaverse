import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiUseTags } from "@nestjs/swagger";
import { Request } from "express";
import { MetaverseAuthGuard } from "../../auth/auth.guard";
import { CurrentUser } from "../../auth/user.decorator";
import { pagination } from "../../common/pagination";
import { HOSTNAME } from "../../environment";
import { User } from "../../user/user.schema";
import { UserService } from "../../user/user.service";
import {
	UsersConnection,
	UsersConnectionsDto,
	UsersConnectionType,
	UsersDto,
	UsersUser,
} from "./users.dto";

@ApiUseTags("interface api")
@Controller("/api/v1/users")
export class UsersController {
	constructor(private userService: UserService) {}

	@Get()
	@ApiBearerAuth()
	@UseGuards(MetaverseAuthGuard())
	async getNearbyUsers(
		@CurrentUser() user: User,
		@Query() usersDto: UsersDto,
	) {
		const { filter, per_page, page, a } = usersDto;
		const domainId = usersDto.status;

		const users: UsersUser[] = [
			{
				username: user.username,
				online: true,
				connection: UsersConnectionType.self,
				location: {
					path: "fuckyou",
					node_id: "",
					root: {},
				},
				images: {
					hero: HOSTNAME + "/api/user/" + user.id + "/image",
					thumbnail: HOSTNAME + "/api/user/" + user.id + "/image",
					tiny: HOSTNAME + "/api/user/" + user.id + "/image",
				},
			},
		];

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

		const users = (await this.userService.findAll()).map(user => {
			return {
				username: user.username,
				online: false,
				connection: UsersConnectionType.connection,
				location: {
					// root: {
					// 	name: "Cutelab!!!",
					// },
				},
				images: {
					thumbnail: HOSTNAME + "/api/user/" + user.id + "/image",
				},
			} as UsersConnection;
		});

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
