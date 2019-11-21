import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { DomainRestriction, DomainAutomaticNetworking } from "./domain.schema";
import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsOptional,
	ValidateNested,
	IsEnum,
} from "class-validator";

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
	label: string;
}

class UpdateDomainHeartbeat {
	@ApiModelPropertyOptional()
	@IsNumber()
	@IsOptional()
	num_anon_users: number;

	@ApiModelPropertyOptional()
	@IsNumber()
	@IsOptional()
	num_users: number;

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
}

export class UpdateDomainDto {
	@ApiModelProperty({ type: UpdateDomain, required: true })
	@ValidateNested()
	@Type(() => UpdateDomain)
	domain: UpdateDomain;
}
