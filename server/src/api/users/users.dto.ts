import { ApiModelPropertyOptional, ApiModelProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsString, IsEnum, IsOptional } from "class-validator";

// users

export enum UsersFilter {
	connections = "connections",
}

export class UsersDto {
	@ApiModelPropertyOptional({
		default: 1000,
		enum: Object.values(UsersFilter),
	})
	@IsEnum(UsersFilter)
	@IsOptional()
	filter: UsersFilter;

	@ApiModelPropertyOptional({
		default: 1000,
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	per_page: number = 1000;

	@ApiModelPropertyOptional({
		default: 1,
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	page: number = 1;

	@ApiModelPropertyOptional({
		default: "",
		description: "Domain ID",
	})
	@IsString()
	@IsOptional()
	status: string = "";

	@ApiModelPropertyOptional({
		default: 0,
		description: "The time? In milliseconds?",
	})
	@IsInt()
	@IsOptional()
	@Transform(n => Number(n))
	a: number = 0;
}

export enum UsersConnectionType {
	self = "self",
	connection = "connection",
	friend = "friend",
}

export interface UsersUser {
	username: string;
	online: boolean;
	connection: UsersConnectionType;
	location: {
		path: string;
		node_id: string;
		root:
			| {
					id: string;
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
	};
	images: {
		hero: string;
		thumbnail: string;
		tiny: string;
	};
}

// connections

export interface UsersConnection {
	username: string;
	online: boolean;
	connection: UsersConnectionType;
	location: {
		root?: {
			name: string;
		};
	};
	images: {
		thumbnail: string;
	};
}

export class UsersConnectionsDto {
	@ApiModelPropertyOptional({ default: 1000 })
	@IsInt()
	@Transform(value => Number(value))
	per_page: number = 1000;

	@ApiModelPropertyOptional({ default: 1 })
	@IsInt()
	@Transform(value => Number(value))
	page: number = 1;

	@ApiModelPropertyOptional({ default: "location,DESC" })
	@IsString()
	sort: string = "location,DESC";
}
