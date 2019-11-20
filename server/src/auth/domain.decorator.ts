import { createParamDecorator } from "@nestjs/common";
import { Request } from "express";

export const CurrentDomain = createParamDecorator((data, req: Request) => {
	return (req.user as any).domain;
});
