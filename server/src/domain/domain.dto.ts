import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	MaxLength,
	ValidateNested,
} from "class-validator";
import { DomainAutomaticNetworking, DomainRestriction } from "./domain.schema";
import { MulterFile } from "../common/multer-file.model";

// class CreateDomain {
// 	@ApiModelPropertyOptional()
// 	@IsOptional()
// 	label: string;
// }

// export class CreateDomainDto {
// 	@ApiModelProperty({ type: CreateDomain })
// 	@ValidateNested()
// 	@Type(() => CreateDomain)
// 	domain: CreateDomain;
// }

export class CreateDomainDto {
	@ApiModelProperty()
	@MaxLength(128)
	label: string;

	@ApiModelPropertyOptional()
	@MaxLength(8192)
	@IsOptional()
	description: string;
}

class UpdateDomainHeartbeat {
	// just anon users, not useful
	// @ApiModelPropertyOptional()
	// @IsNumber()
	// @IsOptional()
	// num_anon_users: number;

	@ApiModelPropertyOptional()
	@IsNumber()
	@IsOptional()
	num_users: number; // total users (with anon)

	@ApiModelPropertyOptional()
	@IsOptional()
	user_hostnames: string[]; // no idea {"*": 1}
}

class UpdateDomain {
	// @ApiModelProperty({ required: true })
	// api_key: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	ice_server_address: string;

	@ApiModelPropertyOptional()
	@IsEnum(DomainAutomaticNetworking)
	@IsOptional()
	automatic_networking: DomainAutomaticNetworking;

	@ApiModelPropertyOptional()
	@IsOptional()
	network_address: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	network_port: string;

	@ApiModelPropertyOptional({ type: UpdateDomainHeartbeat })
	@ValidateNested()
	@Type(() => UpdateDomainHeartbeat)
	@IsOptional()
	heartbeat: UpdateDomainHeartbeat;

	// metadata
	@ApiModelPropertyOptional()
	@MaxLength(8192)
	@IsOptional()
	description: string;

	@ApiModelPropertyOptional()
	@IsNumber()
	@IsOptional()
	capacity: number;

	@ApiModelPropertyOptional()
	@IsEnum(DomainRestriction)
	@IsOptional()
	restriction: DomainRestriction;

	// one or the other... not using this
	@ApiModelPropertyOptional()
	@IsBoolean()
	@IsOptional()
	restricted: boolean;

	@ApiModelPropertyOptional()
	@IsOptional()
	maturity: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	hosts: string;

	@ApiModelPropertyOptional()
	@IsArray()
	@IsOptional()
	tags: string[];

	// versions
	@ApiModelPropertyOptional()
	@IsOptional()
	version: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	protocol: string;

	// not from hifi
	@ApiModelPropertyOptional()
	@IsOptional()
	@MaxLength(128)
	label: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	@MaxLength(128)
	path: string;
}
export class UpdateDomainDto {
	@ApiModelProperty({ type: UpdateDomain, required: true })
	@ValidateNested()
	@Type(() => UpdateDomain)
	domain: UpdateDomain;
}
export class GetDomainsDto {
	@ApiModelPropertyOptional()
	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	page: number = 1;

	@ApiModelPropertyOptional()
	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	amount: number = 50;
}
