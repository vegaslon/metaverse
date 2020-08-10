import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	ValidateNested,
} from "class-validator";
import { DomainAutomaticNetworking, DomainRestriction } from "./domain.schema";

// class CreateDomain {
// 	@IsOptional()
// 	label?: string;
// }

// export class CreateDomainDto {
// 	@ValidateNested()
// 	@Type(() => CreateDomain)
// 	domain: CreateDomain;
// }

export class CreateDomainDto {
	@MaxLength(128)
	label: string;

	@MaxLength(8192)
	@IsOptional()
	description?: string;
}

class UpdateDomainHeartbeat {
	// just anon users, not useful
	// @IsNumber()
	// @IsOptional()
	// num_anon_users?: number;

	@IsNumber()
	@IsOptional()
	num_users?: number; // total users (with anon)

	@IsOptional()
	user_hostnames?: string[]; // no idea {"*": 1}
}

class UpdateDomain {
	// @ApiModelProperty({ required: true })
	// api_key: string;

	@IsOptional()
	ice_server_address?: string;

	@IsEnum(DomainAutomaticNetworking)
	@IsOptional()
	automatic_networking?: DomainAutomaticNetworking;

	@IsOptional()
	network_address?: string;

	@IsOptional()
	network_port?: string;

	@ValidateNested()
	@Type(() => UpdateDomainHeartbeat)
	@IsOptional()
	heartbeat?: UpdateDomainHeartbeat;

	// metadata
	@MaxLength(8192)
	@IsOptional()
	description?: string;

	@IsNumber()
	@IsOptional()
	capacity?: number;

	@IsEnum(DomainRestriction)
	@IsOptional()
	restriction?: DomainRestriction;

	@IsOptional()
	whitelist?: string[];

	// one or the other... not using this
	@IsBoolean()
	@IsOptional()
	restricted?: boolean;

	@IsOptional()
	maturity?: string;

	@IsOptional()
	hosts?: string;

	@IsArray()
	@IsOptional()
	tags?: string[];

	// versions
	@IsOptional()
	version?: string;

	@IsOptional()
	protocol?: string;

	// not from hifi
	@IsOptional()
	@MaxLength(128)
	label?: string;

	// @IsOptional()
	// @MaxLength(128)
	// path?: string;
}

export class UpdateDomainDto {
	@ValidateNested()
	@Type(() => UpdateDomain)
	domain: UpdateDomain;
}

export class GetDomainsDto {
	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	amount?: number = 50;

	@IsString()
	@IsOptional()
	search?: string = "";

	@IsString()
	@IsOptional()
	protocol?: string = "";
}

export class UpdateDomainImageDto {
	@ApiProperty({ type: "string", format: "binary" })
	image: any;
}
