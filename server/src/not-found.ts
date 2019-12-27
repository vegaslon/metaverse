import { ArgumentsHost, Catch, NotFoundException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Request, Response } from "express";
import { existsSync } from "fs";
import * as path from "path";
import { DEV } from "./environment";

const frontendIndexPath = path.resolve(
	__dirname,
	"../../frontend/dist/browser/index.html",
);

@Catch(NotFoundException)
export class NotFoundExceptionFilter extends BaseExceptionFilter {
	catch(exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();

		const req: Request = ctx.getRequest();
		if (req.originalUrl.startsWith("/api/"))
			return super.catch(exception, host);

		const res: Response = ctx.getResponse();

		if (DEV) {
			if (!existsSync(frontendIndexPath))
				return super.catch(exception, host);
			res.sendFile(frontendIndexPath);
		} else {
			res.render("index", { req });
		}
	}
}
