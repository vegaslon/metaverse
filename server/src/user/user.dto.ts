import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
	IsBoolean,
	IsEmail,
	IsEnum,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from "class-validator";

export class UserUpdateEmailDto {
	@ApiPropertyOptional({ example: "fairy@cutelab.space" })
	@IsString({ message: "Email is not a string" })
	@IsEmail({}, { message: "Email is not valid" })
	@MaxLength(64, { message: "Email cannot be longer than 64 characters" })
	email: string = "";
}

export class UserUpdatePasswordDto {
	@ApiPropertyOptional({ example: "" })
	@IsOptional()
	@IsString({ message: "Token is not a string" })
	token: string = "";

	@ApiPropertyOptional({ example: "MyS3cretPa55w0rd" })
	@IsOptional()
	@IsString({ message: "Current password is not a string" })
	// @MinLength(6, {
	// 	message: "Current password cannot be less than 6 characters",
	// })
	@MaxLength(64, {
		message: "Current password cannot be longer than 64 characters",
	})
	currentPassword: string = "";

	@ApiProperty({ example: "MyS3cretPa55w0rd" })
	@IsString({ message: "New password is not a string" })
	@MinLength(6, { message: "New password cannot be less than 6 characters" })
	@MaxLength(64, {
		message: "New password cannot be longer than 64 characters",
	})
	newPassword: string = "";
}

export class UserUpdateImageDto {
	@ApiProperty({ type: "string", required: true, format: "binary" })
	image: any;
}

export class UserUpdateNametagDto {
	@ApiPropertyOptional({ example: "Makitje" })
	@IsOptional()
	@IsString()
	@MaxLength(48)
	displayName?: string;

	@ApiPropertyOptional({ example: "She/Her" })
	@IsOptional()
	@IsString()
	@MaxLength(12)
	@Matches(/^\S*$/, { message: "Gender pronoun can't have spaces" })
	genderPronoun?: string;
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
	@Transform(n => Number(n))
	network_port?: number;

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

// export class GetUserDomainsDto {
// 	@IsNumber()
// 	@IsOptional()
// 	@Transform(n => Number(n))
// 	page?: number = 1;

// 	@IsNumber()
// 	@IsOptional()
// 	@Transform(n => Number(n))
// 	amount?: number = 50;

// 	@IsString()
// 	@IsOptional()
// 	search?: string = "";
// }
