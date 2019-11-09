import { ApiModelProperty, ApiModelPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsOptional,
	ValidateNested,
} from "class-validator";

class CreateDomain {
	@ApiModelPropertyOptional()
	@IsOptional()
	label: string;
}

export class CreateDomainDto {
	@ApiModelProperty({ type: CreateDomain })
	@ValidateNested()
	@Type(() => CreateDomain)
	domain: CreateDomain;
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
	user_hostnames: string[]; // no idea
}

class UpdateDomain {
	// @ApiModelProperty({ required: true })
	// api_key: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	ice_server_address: string;

	@ApiModelPropertyOptional()
	@IsOptional()
	automatic_networking: string;

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
	@IsBoolean()
	@IsOptional()
	restricted: boolean;

	// fucking one or the other
	@ApiModelPropertyOptional()
	@IsOptional()
	restriction: string; // acl or open

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
