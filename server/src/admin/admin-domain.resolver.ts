import { NotFoundException, UseGuards } from "@nestjs/common";
import { Args, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { GqlAdminAuthGuard } from "../auth/guards/admin.guard";
import { Domain, GqlDomain } from "../domain/domain.schema";
import { DomainService } from "../domain/domain.service";

@Resolver(() => GqlDomain)
export class AdminDomainResolver {
	constructor(private readonly domainService: DomainService) {}

	@Query(() => GqlDomain)
	@UseGuards(GqlAdminAuthGuard)
	async domain(
		@Args("id", { type: () => String, nullable: true }) id: string,
	) {
		let domain = await this.domainService.findById(id);
		if (domain == null) {
			throw new NotFoundException("Domain not found");
		}
		return domain;
	}

	@ResolveField()
	async author(@Parent() domain: Domain) {
		await domain.populate("author").execPopulate();
		return domain.author;
	}

	@ResolveField()
	async whitelist(@Parent() domain: Domain) {
		await domain.populate("whitelist").execPopulate();
		return domain.whitelist;
	}

	@ResolveField()
	async userLikes(@Parent() domain: Domain) {
		await domain.populate("userLikes").execPopulate();
		return domain.userLikes;
	}
}
