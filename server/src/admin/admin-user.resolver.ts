import {
	BadRequestException,
	NotFoundException,
	UseGuards,
} from "@nestjs/common";
import {
	Args,
	Mutation,
	ObjectType,
	Parent,
	Query,
	registerEnumType,
	ResolveField,
	Resolver,
} from "@nestjs/graphql";
import { AuthService } from "../auth/auth.service";
import { GqlAdminAuthGuard } from "../auth/guards/admin.guard";
import { GqlUser, User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { InterfaceAuthToken } from "../auth/auth.service";

enum UsersSearchType {
	all,
	online,
	banned,
}

registerEnumType(UsersSearchType, {
	name: "UsersSearchType",
});

@Resolver(() => GqlUser)
export class AdminUserResolver {
	constructor(
		private readonly userService: UserService,
		private readonly authService: AuthService,
	) {}

	@Query(() => GqlUser)
	@UseGuards(GqlAdminAuthGuard)
	async user(
		@Args("id", { type: () => String, nullable: true }) id: string,
		@Args("email", { type: () => String, nullable: true }) email: string,
		@Args("username", { type: () => String, nullable: true })
		username: string,
	) {
		let user: User;

		if (user == null && id != null)
			user = await this.userService.findById(id);
		if (user == null && email != null)
			user = await this.userService.findByEmail(email);
		if (user == null && username != null)
			user = await this.userService.findByIdOrUsername(username);
		if (user == null) {
			throw new NotFoundException("User not found");
		}

		return user;
	}

	@Query(() => [GqlUser])
	@UseGuards(GqlAdminAuthGuard)
	async users(
		@Args("offset", { type: () => Number, defaultValue: 0 }) offset = 0,
		@Args("search", { type: () => String, defaultValue: "" }) search = "",
		@Args("type", {
			type: () => UsersSearchType,
			defaultValue: UsersSearchType.all,
		})
		type = UsersSearchType.all,
	) {
		switch (type) {
			case UsersSearchType.all:
				return this.userService.findUsers(offset, search);
			case UsersSearchType.online:
				return this.userService.findUsersOnlineSorted(offset, search);
			case UsersSearchType.banned:
				return this.userService.findBannedUsers(offset, search);
			default:
				return [];
		}
	}

	@Mutation(() => InterfaceAuthToken)
	async userImpersonate(
		@Args({ name: "id", type: () => String }) id: string,
	) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		return this.authService.login(user);
	}

	@Mutation(() => GqlUser)
	async userToggleVerify(
		@Args({ name: "id", type: () => String }) id: string,
	) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.emailVerified = !user.emailVerified;
		user.emailVerifySecret = "";
		await user.save();

		return user;
	}

	@Mutation(() => GqlUser)
	async userToggleBan(@Args({ name: "id", type: () => String }) id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.banned = !user.banned;
		await user.save();

		return user;
	}

	@Mutation(() => GqlUser)
	async userToggleAdmin(
		@Args({ name: "id", type: () => String }) id: string,
	) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.admin = !user.admin;
		await user.save();

		return user;
	}

	@Mutation(() => GqlUser)
	async userToggleSupporter(
		@Args({ name: "id", type: () => String }) id: string,
	) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.supporter = !user.supporter;
		await user.save();

		return user;
	}

	@Mutation(() => GqlUser)
	async userToggleDev(@Args({ name: "id", type: () => String }) id: string) {
		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.dev = !user.dev;
		await user.save();

		return user;
	}

	@Mutation(() => GqlUser)
	async userUpdateMaxFilesSize(
		@Args({ name: "id", type: () => String }) id: string,
		@Args({ name: "maxFilesSize", type: () => Number })
		maxFilesSize: number,
	) {
		if (typeof maxFilesSize != "number")
			throw new BadRequestException("Invalid max files size");

		const user = await this.userService.findById(id);
		if (user == null) throw new NotFoundException("User not found");

		user.maxFilesSize = maxFilesSize;
		await user.save();

		return user;
	}

	@ResolveField()
	async domains(@Parent() user: User) {
		await user.populate("domains").execPopulate();
		return user.domains;
	}

	@ResolveField()
	async domainLikes(@Parent() user: User) {
		await user.populate("domainLikes").execPopulate();
		return user.domainLikes;
	}

	@ResolveField()
	async friends(@Parent() user: User) {
		await user.populate("friends").execPopulate();
		return user.friends;
	}
}
