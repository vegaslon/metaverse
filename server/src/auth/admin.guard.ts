import { HttpException, mixin, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export function AdminAuthGuard() {
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

				if (!user.admin) throw new UnauthorizedException();

				return user;
			}
		},
	);
}
