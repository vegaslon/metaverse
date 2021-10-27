import { ApiProperty } from "@nestjs/swagger";
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from "class-validator";

export enum AuthTokenGrantType {
	password = "password",
}

export enum AuthTokenScope {
	owner = "owner",
}

class AuthDto {
	@ApiProperty({ example: "MyS3cretPa55w0rd" })
	@IsNotEmpty({ message: "Password is required" })
	@IsString({ message: "Password is not a string" })
	@MinLength(6, { message: "Password cannot be less than 6 characters" })
	@MaxLength(64, { message: "Password cannot be longer than 64 characters" })
	password: string = "";
}

export class AuthTokenDto extends AuthDto {
	@ApiProperty({ example: "Fairy" })
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
	@ApiProperty({ enum: AuthTokenGrantType })
	@IsNotEmpty({ message: "Grant type is required" })
	@IsEnum(AuthTokenGrantType, { message: "Grant type is invalud" })
	grant_type: AuthTokenGrantType;

	@ApiProperty({ enum: AuthTokenScope })
	@IsNotEmpty({ message: "Scope is required" })
	@IsEnum(AuthTokenScope, { message: "Scope is invalid" })
	scope: AuthTokenScope;
}

export class AuthSignUpDto extends AuthDto {
	@ApiProperty({ example: "fairy@cutelab.space" })
	@IsNotEmpty({ message: "Email is required" })
	@IsString({ message: "Email is not a string" })
	@IsEmail({}, { message: "Email is not valid" })
	@MaxLength(64, { message: "Email cannot be longer than 64 characters" })
	email: string = "";

	@ApiProperty({ example: "Fairy" })
	@IsNotEmpty({ message: "Username is required" })
	@IsString({ message: "Username is not a string" })
	@MinLength(4, { message: "Username cannot be less than 4 characters" })
	@MaxLength(16, { message: "Username cannot be longer than 16 characters" })
	@Matches(/^[a-zA-Z0-9\_]+$/, {
		message: "Username needs to use letters, numbers and underscores only",
	})
	username: string = "";

	@ApiProperty({})
	@IsNotEmpty({ message: "Captcha ID is required" })
	@IsString({ message: "Captcha ID is not a string" })
	captchaId: string = "";

	@ApiProperty({})
	@IsNotEmpty({ message: "Captcha response is required" })
	@IsString({ message: "Captcha response is not a string" })
	captchaResponse: string = "";
}

export class AuthExtSignUpDto {
	@ApiProperty({ example: "" })
	@IsNotEmpty({ message: "Token is required" })
	@IsString({ message: "Token is not a string" })
	token: string = "";

	@ApiProperty({ example: "Fairy" })
	@IsNotEmpty({ message: "Username is required" })
	@IsString({ message: "Username is not a string" })
	@MinLength(4, { message: "Username cannot be less than 4 characters" })
	@MaxLength(16, { message: "Username cannot be longer than 16 characters" })
	@Matches(/^[a-zA-Z0-9\_]+$/, {
		message: "Username needs to use letters, numbers and underscores only",
	})
	username: string = "";

	@ApiProperty({ example: "" })
	@IsString({ message: "Image URL is not a string" })
	@IsOptional()
	imageUrl: string = "";
}
