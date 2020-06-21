import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../user/user.schema";

// function notAuthorized() {
// 	throw new HttpException(
// 		{
//			statusCode: 401,
// 			error: "You need to sign in or sign up before continuing.",
// 		},
// 		401,
// 	);
// }

@Injectable()
export class MetaverseAuthGuard extends AuthGuard() {
	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		if (user._id == null) throw new UnauthorizedException();
		if (
			(user as User).emailVerified === false &&
			(user as User).admin === false
		)
			throw new UnauthorizedException(null, "Unverified");

		return user;
	}
}
