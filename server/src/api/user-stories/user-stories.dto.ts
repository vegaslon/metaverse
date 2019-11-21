import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";
import {
	IsInt,
	IsString,
	IsBoolean,
	IsOptional,
	IsEnum,
} from "class-validator";
import { Transform } from "class-transformer";

export enum UserStoryAction {
	snapshot = "snapshot",
	concurrency = "concurrency",
	announcement = "announcement",
}

export enum UserStroyAudience {
	for_feed = "for_feed",
}

export interface UserStory {
	id: number;
	user_id: string;
	username: string;
	action: UserStoryAction;
	action_string: string;
	audience: UserStroyAudience;
	place_id: string;
	place_name: string;
	path: string;
	thumbnail_url: string;
	details: {
		image_url: string;
		concurrency?: number; // concurrency
		snapshot_id?: string; // snapshot
		shareable_url?: string; // snapshot
		original_image_file_name?: string; // snapshot
	};
	updated_at: string; // iso string
	domain_id: string;
	hold_time: number; // or null
	is_stacked: boolean; // multiple snapshots
	isStacked: boolean; // multiple snapshots
	standalone_optimized: boolean; // false
}

export class UserStoriesDto {
	@ApiModelProperty({
		enum: Object.values(UserStoryAction),
		default: UserStoryAction.concurrency,
	})
	@IsEnum(UserStoryAction)
	include_actions: UserStoryAction;

	@ApiModelPropertyOptional({
		default: "open,hifi",
		description:
			'"open" is anonymous, "hifi" is logged in, "acl" is private (but ignored here)',
	})
	@IsString()
	@IsOptional()
	restriction: string = "open,hifi";

	@ApiModelPropertyOptional({
		description: "Filters online domains",
	})
	@IsOptional()
	@IsBoolean()
	@Transform(b => b == "true")
	require_online: boolean = true;

	@ApiModelPropertyOptional()
	@IsOptional()
	@IsString()
	protocol: string = "";

	@ApiModelPropertyOptional({
		default: 10,
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	per_page: number = 10;

	@ApiModelPropertyOptional({ default: 1 })
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	page: number = 1;

	@ApiModelPropertyOptional()
	@IsOptional()
	@IsString()
	search: string = "";
}
