import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		const user = ctx.switchToHttp().getRequest().user;

		if (user == null) return null;
		if (user.username == null) return null; // user can be a domain
		return user;
	},
);
