import { mixin, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export function DomainAuthGuard() {
	return mixin(
		class JwtAuthGuard extends AuthGuard() {
			handleRequest(err, user, info, context) {
				if (err) throw new UnauthorizedException();
				if (user.domain == null) throw new UnauthorizedException();
				if (user.domain._id == null) throw new UnauthorizedException();

				return user;
			}
		},
	);
}
