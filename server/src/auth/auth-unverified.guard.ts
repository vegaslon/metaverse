import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

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
export class MetaverseUnverifiedAuthGuard extends AuthGuard() {
	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		if (user._id == null) throw new UnauthorizedException();
		// if ((user as User).emailVerified == false)
		// 	throw new UnauthorizedException(null, "Unverified");

		return user;
	}
}
