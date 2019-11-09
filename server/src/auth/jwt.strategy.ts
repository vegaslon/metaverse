import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWT_SECRET } from "../environment";
import { UserService } from "../user/user.service";

export interface JwtPayload {
	//username: string;
	id: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private userService: UserService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: JWT_SECRET,
		});
	}

	async validate(payload: JwtPayload) {
		const user = this.userService.findById(payload.id);
		return user;
	}
}
