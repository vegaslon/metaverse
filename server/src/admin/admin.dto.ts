import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsBoolean } from "class-validator";

export class GetUsersDto {
	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	page?: number = 1;

	@IsNumber()
	@IsOptional()
	@Transform(n => Number(n))
	amount?: number = 50;

	@IsBoolean()
	@IsOptional()
	@Transform(b => b == "true")
	onlineSorted?: boolean = false;
}
