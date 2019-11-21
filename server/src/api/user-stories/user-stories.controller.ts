import { Controller, Get, Query } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { pagination } from "../../common/utils";
import { DomainService } from "../../domain/domain.service";
import { UserStoriesDto, UserStory, UserStoryAction } from "./user-stories.dto";
import { createConcurrency } from "./user-stories.helper";

@ApiUseTags("from hifi")
@Controller("api/v1/user_stories")
export class UserStoriesController {
	constructor(private domainService: DomainService) {}

	@Get()
	async getUserStories(@Query() userStoriesDto: UserStoriesDto) {
		// this is all temporary

		let {
			include_actions,
			restriction,
			require_online,
			protocol,
			per_page,
			page,
		} = userStoriesDto;

		page = page <= 0 ? 1 : page;

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
			const domainIDs = Object.keys(this.domainService.sessions).splice(
				per_page * (page - 1),
				per_page,
			);

			for (let domainID of domainIDs) {
				const domain = await this.domainService.findById(domainID);

				const restrictions = restriction.split(",");

				if (restrictions.includes(domain.restriction))
					user_stories.push(
						createConcurrency(
							domain,
							this.domainService.sessions[domain._id],
						),
					);
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
