import {
	UserStory,
	UserStoryAction,
	UserStroyAudience,
} from "./user-stories.dto";
import { Domain } from "../../domain/domain.schema";
import { DomainSession } from "../../domain/domain.service";

// export function createAnnouncement(
// 	name: string,
// 	image: string,
// 	number: number,
// ): UserStory {
// 	return {
// 		id: 0,
// 		user_id: "idontcare",
// 		username: "Caitlyn",
// 		action: UserStoryAction.announcement,
// 		action_string: "havin' a great time!",
// 		audience: UserStroyAudience.for_feed,
// 		place_id: "idontcareagain",
// 		place_name: name,
// 		path: "/0,0,0",
// 		thumbnail_url: image,
// 		details: {
// 			image_url: image,
// 			concurrency: number,
// 		},
// 		updated_at: new Date().toISOString(),
// 		domain_id: "idontcareagainagain",
// 		hold_time: null,
// 		is_stacked: false,
// 		isStacked: false,
// 		standalone_optimized: false,
// 	};
// }

export function createConcurrency(
	domain: Domain,
	session: DomainSession,
): UserStory {
	const concurrency =
		session == null ? 0 : session.numUsers + session.numAnonUsers;

	return {
		id: domain._id,
		user_id: "",
		username: "",
		action: UserStoryAction.concurrency,
		action_string: "",
		audience: UserStroyAudience.for_feed,
		place_id: domain._id,
		place_name: domain._id,
		path: domain.path,
		thumbnail_url: "",
		details: {
			image_url: "",
			concurrency,
		},
		updated_at: new Date().toISOString(),
		domain_id: domain.id,
		hold_time: null,
		is_stacked: false,
		isStacked: false,
		standalone_optimized: false,
	};
}

// export function createSnapshot(name: string, image: string): UserStory {
// 	return {
// 		id: 0,
// 		user_id: "idontcare",
// 		username: name,
// 		action: UserStoryAction.snapshot,
// 		action_string: "havin' a great time!",
// 		audience: UserStroyAudience.for_feed,
// 		place_id: "idontcareagain",
// 		place_name: name,
// 		path: "/0,0,0",
// 		thumbnail_url: image,
// 		details: {
// 			image_url: image,
// 			snapshot_id: " dontcare!",
// 			shareable_url: "https://google.com",
// 			original_image_file_name: name + ".jpg",
// 		},
// 		updated_at: new Date().toISOString(),
// 		domain_id: "idontcareagainagain",
// 		hold_time: null,
// 		is_stacked: false,
// 		isStacked: false,
// 		standalone_optimized: false,
// 	};
// }
