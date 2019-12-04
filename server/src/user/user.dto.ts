import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
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
} from "class-validator";

export class UserUpdateDto {
	@ApiModelPropertyOptional({ example: "fairy@cutelab.space" })
	@IsString({ message: "Email is not a string" })
	@IsEmail({}, { message: "Email is not valid" })
	@MaxLength(64, { message: "Email cannot be longer than 64 characters" })
	@IsOptional()
	email: string = "";

	@ApiModelPropertyOptional({ example: "MyS3cretPa55w0rd" })
	@IsString({ message: "Password is not a string" })
	@MinLength(6, { message: "Password cannot be less than 6 characters" })
	@MaxLength(64, { message: "Password cannot be longer than 64 characters" })
	@IsOptional()
	password: string = "";
}

// updating user location

export enum UserAvailability {
	all = "all",
	connections = "connections",
	friends = "friends",
	none = "none",
}

export class UserUpdateLocation {
	@ApiModelPropertyOptional()
	@IsEnum(UserAvailability)
	@IsOptional()
	availability: UserAvailability;

	@ApiModelPropertyOptional()
	@IsBoolean()
	@IsOptional()
	connected: boolean;

	@ApiModelPropertyOptional()
	@IsString()
	@IsOptional()
	domain_id: string;

	@ApiModelPropertyOptional()
	@IsString()
	@IsOptional()
	network_address: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	@Transform(n => n + "")
	network_port: string;

	@ApiModelPropertyOptional()
	@IsString()
	@IsOptional()
	node_id: string; // id of user on domain

	@ApiModelPropertyOptional()
	@IsString()
	@IsOptional()
	path: string;

	@ApiModelPropertyOptional()
	@IsString()
	@IsOptional()
	place_id: string;
}

export class UserUpdateLocationDto {
	@ApiModelProperty({ type: UserUpdateLocation, required: true })
	@ValidateNested()
	@Type(() => UserUpdateLocation)
	location: UserUpdateLocation;
}

export class UserSettingsDto {
	@ApiModelProperty()
	interface: any = {};

	@ApiModelProperty()
	avatarBookmarks: any = {};
}
