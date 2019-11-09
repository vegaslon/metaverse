import {
	IsString,
	IsEmail,
	IsOptional,
	MinLength,
	MaxLength,
} from "class-validator";
import { ApiModelPropertyOptional } from "@nestjs/swagger";

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
