import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class MetaverseUnverifiedAuthGuard extends AuthGuard() {
	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		if (user._id == null) throw new UnauthorizedException();

		// allow banned users to retrieve their data
		// if ((user as User).banned === true) {
		// 	throw new UnauthorizedException(null, "Access denied");
		// }

		return user;
	}
}
