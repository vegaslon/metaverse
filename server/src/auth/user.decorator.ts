import { createParamDecorator } from "@nestjs/common";
import { Request } from "express";

export const CurrentUser = createParamDecorator((data, req: Request) => {
	if (req.user == null) return null;
	if ((req.user as any).username == null) return null; // req.user can be a domain
	return req.user;
});
