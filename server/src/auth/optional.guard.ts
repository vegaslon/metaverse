import { mixin } from "@nestjs/common";
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

export function OptionalAuthGuard() {
	return mixin(
		class JwtAuthGuard extends AuthGuard() {
			handleRequest(err, user, info, context) {
				return user;
			}
		},
	);
}
