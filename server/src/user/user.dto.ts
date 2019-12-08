import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import {
	IsEmail,
	IsEnum,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
	ValidateNested,
	IsBoolean,
	IsNumber,
} from "class-validator";

export class UserUpdateDto {
	@ApiPropertyOptional({ example: "fairy@cutelab.space" })
	@IsString({ message: "Email is not a string" })
	@IsEmail({}, { message: "Email is not valid" })
	@MaxLength(64, { message: "Email cannot be longer than 64 characters" })
	@IsOptional()
	email?: string = "";

	@ApiPropertyOptional({ example: "MyS3cretPa55w0rd" })
	@IsString({ message: "Password is not a string" })
	@MinLength(6, { message: "Password cannot be less than 6 characters" })
	@MaxLength(64, { message: "Password cannot be longer than 64 characters" })
	@IsOptional()
	password?: string = "";
}

export class UserUpdateImageDto {
	@ApiProperty({ type: "string", format: "binary" })
	image: any;
}

// updating user location

export enum UserAvailability {
	all = "all",
	connections = "connections",
	friends = "friends",
	none = "none",
}

export class UserUpdateLocation {
	@IsEnum(UserAvailability)
	@IsOptional()
	availability?: UserAvailability;

	@IsBoolean()
	@IsOptional()
	connected?: boolean;

	@IsString()
	@IsOptional()
	domain_id?: string;

	@IsString()
	@IsOptional()
	network_address?: string;

	@IsOptional()
	@Transform(n => n + "")
	network_port?: string;

	@IsString()
	@IsOptional()
	node_id?: string; // id of user on domain

	@IsString()
	@IsOptional()
	path?: string;

	@IsString()
	@IsOptional()
	place_id?: string;
}

export class UserUpdateLocationDto {
	@ValidateNested()
	@Type(() => UserUpdateLocation)
	location: UserUpdateLocation;
}

export class UserSettingsDto {
	@IsString()
	interface: string;

	@IsString()
	avatarBookmarks: string;
}

export class GetUserDomainsLikesDto {
	@IsBoolean()
	@IsOptional()
	@Transform(b => b == "true")
	populate? = false;

	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	amount?: number = 50;

	// @IsString()
	// @IsOptional()
	// search?: string = "";
}
