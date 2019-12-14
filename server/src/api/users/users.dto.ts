import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsString, IsEnum, IsOptional } from "class-validator";

// users

export class UsersDto {
	@ApiPropertyOptional({
		default: "",
		description: 'Can be "connections" but isn\'t used',
	})
	@IsOptional()
	filter?: string;

	@ApiPropertyOptional({
		default: 1000,
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	per_page?: number = 1000;

	@ApiPropertyOptional({
		default: 1,
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	page?: number = 1;

	@ApiPropertyOptional({
		default: "",
		description: "Domain ID",
	})
	@IsString()
	@IsOptional()
	status?: string = "";

	@ApiPropertyOptional({
		default: 0,
		description: "The time? In milliseconds?",
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	a?: number = 0;
}

export enum UsersConnectionType {
	self = "self",
	connection = "connection",
	//friend = "friend",
}

export interface UsersLocation {
	path: string;
	node_id: string;
	root:
		| {
				id: string; // id of place name? so domain id
				name: string;
				domain: {
					id: string;
					network_address: string;
					network_port: number;
					cloud_domain: boolean;
					online: boolean;
					default_place_name: string;
				};
		  }
		| {};
	online?: boolean;
}

export interface UsersUser {
	username: string;
	online: boolean;
	connection: UsersConnectionType;
	location: UsersLocation;
	images: {
		hero: string;
		thumbnail: string;
		tiny: string;
	};
}

// connections

// export interface UsersConnection {
// 	username: string;
// 	online: boolean;
// 	connection: UsersConnectionType;
// 	location: {
// 		root?: {
// 			name: string; // place name (domain id)
// 		};
// 	};
// 	images: {
// 		thumbnail: string;
// 	};
// }

// export class UsersConnectionsDto {
// 	@ApiPropertyOptional({ default: 1000 })
// 	@IsInt()
// 	@Transform(value => Number(value))
// 	per_page?: number = 1000;

// 	@ApiPropertyOptional({ default: 1 })
// 	@IsInt()
// 	@Transform(value => Number(value))
// 	page?: number = 1;

// 	@ApiPropertyOptional({ default: "location,DESC" })
// 	@IsString()
// 	sort?: string = "location,DESC";
// 	// location,DESC/ASC
// 	// is_friend,DESC/ASC
// 	// username,DESC/ASC
// }
