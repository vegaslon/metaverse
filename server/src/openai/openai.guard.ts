import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { OpenaiService } from "./openai.service";

@Injectable()
export class OpenaiAuthGuard implements CanActivate {
	constructor(private readonly openaiService: OpenaiService) {}

	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const request: Request = context.switchToHttp().getRequest();
		const tokenStr = request.headers.authorization;
		if (tokenStr.startsWith("Bearer ")) {
			const token = tokenStr.slice("Bearer ".length);
			return this.openaiService.getDocFromToken(token) != null;
		} else {
			return false;
		}
	}
}
