import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentDomain = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const user = ctx.switchToHttp().getRequest().user;
		return user.domain;
	},
);
