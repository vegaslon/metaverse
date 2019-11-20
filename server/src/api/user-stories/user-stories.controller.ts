import { Controller, Get, Query } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { pagination } from "../../common/utils";
import { DomainService } from "../../domain/domain.service";
import { UserStoriesDto, UserStory, UserStoryAction } from "./user-stories.dto";
import { createConcurrency } from "./user-stories.helper";

@ApiUseTags("from hifi")
@Controller("/api/v1/user_stories")
export class UserStoriesController {
	constructor(private domainService: DomainService) {}

	@Get()
	async getUserStories(@Query() userStoriesDto: UserStoriesDto) {
		const {
			include_actions,
			restriction,
			require_online,
			protocol,
			per_page,
			page,
		} = userStoriesDto;

		let user_stories: UserStory[] = [];

		// switch (include_actions) {
		// 	case UserStoryAction.announcement:
		// 		user_stories.push(
		// 			createAnnouncement(
		// 				"Eentje can finally fly!!!!",
		// 				"https://i.imgur.com/n8YKkGN.png",
		// 				1,
		// 			),
		// 		);
		// 		break;
		// 	case UserStoryAction.concurrency:
		// 		user_stories.push(
		// 			createConcurrency(
		// 				"Cutelab",
		// 				"https://i.imgur.com/zlf7vaS.png",
		// 				888,
		// 			),
		// 			createConcurrency(
		// 				"Pink Squire",
		// 				"https://i.imgur.com/btHqRpw.png",
		// 				-7,
		// 			),
		// 		);
		// 		break;
		// 	case UserStoryAction.snapshot:
		// 		user_stories.push(
		// 			createSnapshot("Maki", "https://i.imgur.com/6RiGvqG.png"),
		// 			createSnapshot(
		// 				"Caitlyn",
		// 				"https://i.imgur.com/3wtKv7H.png",
		// 			),
		// 		);
		// 		break;
		// }

		if (include_actions == UserStoryAction.concurrency) {
			const domains = await this.domainService.getAllDomains(
				page,
				per_page,
			);

			for (let domain of domains) {
				const restrictions = restriction.split(",");

				if (restrictions.includes(domain.restriction))
					user_stories.push(createConcurrency(domain, restriction));
			}
		}

		const sliced = pagination(page, per_page, user_stories);

		return {
			status: "success",
			...sliced.info,
			user_stories: sliced.data,
		};
	}
}
