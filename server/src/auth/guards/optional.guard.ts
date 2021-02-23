import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../../user/user.schema";

@Injectable()
export class OptionalAuthGuard extends AuthGuard() {
	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		if (user == false) return null;

		if (
			(user as User).emailVerified === false &&
			(user as User).admin === false
		) {
			return null;
		}

		return user;
	}
}
