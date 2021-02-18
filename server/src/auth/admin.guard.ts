import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../user/user.schema";

@Injectable()
export class AdminAuthGuard extends AuthGuard() {
	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		if (user._id == null) throw new UnauthorizedException();

		// must be verified unless admin
		if (
			(user as User).emailVerified === false &&
			(user as User).admin === false
		) {
			throw new UnauthorizedException(null, "Unverified");
		}

		// must be unbanned
		if ((user as User).banned === true) {
			throw new UnauthorizedException(null, "Access denied");
		}

		// must be admin
		if ((user as User).admin === false) {
			throw new UnauthorizedException(null, "Access denied");
		}

		return user;
	}
}
