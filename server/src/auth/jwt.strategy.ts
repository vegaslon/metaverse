import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { DomainService } from "../domain/domain.service";
import { JWT_SECRET } from "../environment";
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";

export enum JwtPayloadType {
	USER,
	DOMAIN,
}

export interface JwtPayload {
	t: JwtPayloadType;
	id: string;
	s?: string; // domain secret

	exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private userService: UserService,
		private domainService: DomainService,
		private jwtService: JwtService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: JWT_SECRET,
			ignoreExpiration: true,
		});
	}

	async validate(payload: JwtPayload) {
		const now = +new Date() / 1000;

		if (payload.t == JwtPayloadType.USER) {
			if (now > payload.exp) return;

			const user = await this.userService.findById(payload.id);
			if (user == null) return;

			return user;
		}

		if (payload.t == JwtPayloadType.DOMAIN) {
			const domain = await this.domainService.findById(payload.id);
			if (domain.secret != payload.s) return;

			return { domain };
		}

		return;
	}
}
