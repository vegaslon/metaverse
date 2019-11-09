import { HttpException, mixin } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export function MetaverseAuthGuard() {
	return mixin(
		class JwtAuthGuard extends AuthGuard() {
			handleRequest(err, user, info, context) {
				if (err || !user) {
					throw new HttpException(
						{
							error:
								"You need to sign in or sign up before continuing.",
						},
						401,
					);
				}

				return user;
			}
		},
	);
}
