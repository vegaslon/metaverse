import { HttpException, mixin, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export function AdminAuthGuard() {
	return mixin(
		class JwtAuthGuard extends AuthGuard() {
			handleRequest(err, user, info, context) {
				if (err) throw new UnauthorizedException();
				if (user._id == null) throw new UnauthorizedException();
				if (user.admin == false) throw new UnauthorizedException();

				return user;
			}
		},
	);
}
