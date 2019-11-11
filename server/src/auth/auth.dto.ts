import { ApiModelProperty } from "@nestjs/swagger";
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	NotContains,
	IsOptional,
} from "class-validator";

export enum AuthTokenGrantType {
	password = "password",
}

export enum AuthTokenScope {
	owner = "owner",
}

class AuthDto {
	@ApiModelProperty({ example: "MyS3cretPa55w0rd" })
	@IsNotEmpty({ message: "Password is required" })
	@IsString({ message: "Password is not a string" })
	@MinLength(6, { message: "Password cannot be less than 6 characters" })
	@MaxLength(64, { message: "Password cannot be longer than 64 characters" })
	password: string = "";
}

export class AuthTokenDto extends AuthDto {
	@ApiModelProperty({ example: "Fairy" })
	@IsNotEmpty({ message: "Username or email is required" })
	@IsString({ message: "Username or email is not a string" })
	@MinLength(4, {
		message: "Username or email cannot be less than 4 characters",
	})
	@MaxLength(64, {
		message: "Username or email cannot be longer than 64 characters",
	})
	username: string;

	// hifi trash
	@ApiModelProperty({ enum: AuthTokenGrantType })
	@IsNotEmpty({ message: "Grant type is required" })
	@IsEnum(AuthTokenGrantType, { message: "Grant type is invalud" })
	grant_type: AuthTokenGrantType;

	@ApiModelProperty({ enum: AuthTokenScope })
	@IsNotEmpty({ message: "Scope is required" })
	@IsEnum(AuthTokenScope, { message: "Scope is invalid" })
	scope: AuthTokenScope;
}

export class AuthSignUpDto extends AuthDto {
	@ApiModelProperty({ example: "fairy@cutelab.space" })
	@IsNotEmpty({ message: "Email is required" })
	@IsString({ message: "Email is not a string" })
	@IsEmail({}, { message: "Email is not valid" })
	@MaxLength(64, { message: "Email cannot be longer than 64 characters" })
	email: string = "";

	@ApiModelProperty({ example: "Fairy" })
	@IsNotEmpty({ message: "Username is required" })
	@IsString({ message: "Username is not a string" })
	@MinLength(4, { message: "Username cannot be less than 4 characters" })
	@MaxLength(24, { message: "Username cannot be longer than 24 characters" })
	@Matches(/^[a-zA-Z0-9\.\_]+$/, {
		message:
			"Username needs to use letters, numbers, dots and underscores only",
	})
	@Matches(/^[^\.\_][a-zA-Z0-9\.\_]*[^\.\_]$/, {
		message: "Username cannot start or end with a dot or underscore",
	})
	@NotContains("..", {
		message: "Username cannot contain repeating dots",
	})
	@NotContains("__", {
		message: "Username cannot contain repeating underscores",
	})
	@NotContains("._", {
		message: "Username cannot have dots and underscores next to each other",
	})
	@NotContains("_.", {
		message: "Username cannot have dots and underscores next to each other",
	})
	username: string = "";
}

export class AuthExtSignUpDto {
	@ApiModelProperty({ example: "" })
	@IsNotEmpty({ message: "Token is required" })
	@IsString({ message: "Token is not a string" })
	token: string = "";

	@ApiModelProperty({ example: "Fairy" })
	@IsNotEmpty({ message: "Username is required" })
	@IsString({ message: "Username is not a string" })
	@MinLength(4, { message: "Username cannot be less than 4 characters" })
	@MaxLength(24, { message: "Username cannot be longer than 24 characters" })
	@Matches(/^[a-zA-Z0-9\.\_]+$/, {
		message:
			"Username needs to use letters, numbers, dots and underscores only",
	})
	@Matches(/^[^\.\_][a-zA-Z0-9\.\_]*[^\.\_]$/, {
		message: "Username cannot start or end with a dot or underscore",
	})
	@NotContains("..", {
		message: "Username cannot contain repeating dots",
	})
	@NotContains("__", {
		message: "Username cannot contain repeating underscores",
	})
	@NotContains("._", {
		message: "Username cannot have dots and underscores next to each other",
	})
	@NotContains("_.", {
		message: "Username cannot have dots and underscores next to each other",
	})
	username: string = "";

	@ApiModelProperty({ example: "" })
	@IsString({ message: "Image URL is not a string" })
	@IsOptional()
	imageUrl: string = "";
}
