import { mixin, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../user/user.schema";

export function AdminAuthGuard() {
	return mixin(
		class JwtAuthGuard extends AuthGuard() {
			handleRequest(err, user, info, context) {
				if (err) throw new UnauthorizedException();
				if (user._id == null) throw new UnauthorizedException();
				if ((user as User).emailVerified == false)
					throw new UnauthorizedException(null, "Unverified");
				if ((user as User).admin == false)
					throw new UnauthorizedException();

				return user;
			}
		},
	);
}
