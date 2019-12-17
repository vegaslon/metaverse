import { mixin, UnauthorizedException } from "@nestjs/common";
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

export function OptionalAuthGuard() {
	return mixin(
		class JwtAuthGuard extends AuthGuard() {
			handleRequest(err, user, info, context) {
				if (err) throw new UnauthorizedException();
				if (user == false) return null;
				if ((user as User).emailVerified == false) return null;
				return user;
			}
		},
	);
}
