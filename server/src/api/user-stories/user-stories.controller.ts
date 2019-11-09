import { Controller, Get, Query } from "@nestjs/common";
import { ApiUseTags } from "@nestjs/swagger";
import { pagination } from "../../common/pagination";
import { UserStoriesDto, UserStory, UserStoryAction } from "./user-stories.dto";
import { DomainService } from "../../domain/domain.service";
import {
	createAnnouncement,
	createConcurrency,
	createSnapshot,
} from "./user-stories.helper";

@ApiUseTags("interface api")
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

		switch (include_actions) {
			case UserStoryAction.announcement:
				user_stories.push(
					createAnnouncement(
						"Eentje can finally fly!!!!",
						"https://i.imgur.com/n8YKkGN.png",
						1,
					),
				);
				break;
			case UserStoryAction.concurrency:
				// user_stories.push(
				// 	createConcurrency(
				// 		"Cutelab",
				// 		"https://i.imgur.com/zlf7vaS.png",
				// 		888,
				// 	),
				// 	createConcurrency(
				// 		"Pink Squire",
				// 		"https://i.imgur.com/btHqRpw.png",
				// 		-7,
				// 	),
				// );

				let places = [];
				const domains = await this.domainService.getAllDomains(
					page,
					per_page,
				);
				for (let domain of domains) {
					places.push(
						createConcurrency(
							domain.networkAddress + ":" + domain.networkPort,
							"",
							domain.onlineUsers + domain.onlineAnonUsers,
						),
					);
				}

				const sliced = pagination(page, per_page, places);
				return {
					status: "success",
					...sliced.info,
					user_stories: sliced.data,
				};

				break;
			case UserStoryAction.snapshot:
				user_stories.push(
					createSnapshot("Maki", "https://i.imgur.com/6RiGvqG.png"),
					createSnapshot(
						"Caitlyn",
						"https://i.imgur.com/3wtKv7H.png",
					),
				);
				break;
		}

		const sliced = pagination(page, per_page, user_stories);

		return {
			status: "success",
			...sliced.info,
			user_stories: sliced.data,
		};
	}
}
