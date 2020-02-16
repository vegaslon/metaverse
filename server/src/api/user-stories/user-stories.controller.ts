import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DomainService } from "../../domain/domain.service";

@ApiTags("from hifi")
@Controller("api/v1/user_stories")
export class UserStoriesController {
	constructor(private domainService: DomainService) {}

	// @Get()
	// @ApiOperation({ deprecated: true })
	// async getUserStories(@Query() userStoriesDto: UserStoriesDto) {
	// 	// this is all temporary

	// 	let {
	// 		include_actions,
	// 		restriction,
	// 		require_online,
	// 		protocol,
	// 		per_page,
	// 		page,
	// 		search,
	// 	} = userStoriesDto;

	// 	let user_stories: UserStory[] = [];

	// 	// switch (include_actions) {
	// 	// 	case UserStoryAction.announcement:
	// 	// 		user_stories.push(
	// 	// 			createAnnouncement(
	// 	// 				"Eentje can finally fly!!!!",
	// 	// 				"https://i.imgur.com/n8YKkGN.png",
	// 	// 				1,
	// 	// 			),
	// 	// 		);
	// 	// 		break;
	// 	// 	case UserStoryAction.concurrency:
	// 	// 		user_stories.push(
	// 	// 			createConcurrency(
	// 	// 				"Cutelab",
	// 	// 				"https://i.imgur.com/zlf7vaS.png",
	// 	// 				888,
	// 	// 			),
	// 	// 			createConcurrency(
	// 	// 				"Pink Squire",
	// 	// 				"https://i.imgur.com/btHqRpw.png",
	// 	// 				-7,
	// 	// 			),
	// 	// 		);
	// 	// 		break;
	// 	// 	case UserStoryAction.snapshot:
	// 	// 		user_stories.push(
	// 	// 			createSnapshot("Maki", "https://i.imgur.com/6RiGvqG.png"),
	// 	// 			createSnapshot(
	// 	// 				"Caitlyn",
	// 	// 				"https://i.imgur.com/3wtKv7H.png",
	// 	// 			),
	// 	// 		);
	// 	// 		break;
	// 	// }

	// 	if (include_actions == UserStoryAction.concurrency) {
	// 		const restrictions = restriction.split(",");
	// 		const anonymousOnly = !restrictions.includes("hifi");

	// 		const foundDomains = await this.domainService
	// 			.findOnlineDomains(page, per_page, "", anonymousOnly)
	// 			.populate("+author");

	// 		for (let domain of foundDomains) {
	// 			user_stories.push(createConcurrency(domain));
	// 		}
	// 	}

	// 	const sliced = pagination(page, per_page, user_stories);

	// 	return {
	// 		status: "success",
	// 		...sliced.info,
	// 		user_stories: sliced.data,
	// 	};
	// }
}
