import {
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";
import { User } from "../../user/user.schema";

function handleUser(user: User) {
	if (user == null) throw new UnauthorizedException();
	if (user._id == null) throw new UnauthorizedException();

	// must be verified unless admin
	if (user.emailVerified === false && user.admin === false) {
		throw new UnauthorizedException(null, "Unverified");
	}

	// must be unbanned
	if (user.banned === true) {
		throw new UnauthorizedException(null, "Access denied");
	}

	// must be admin
	if (user.admin === false) {
		throw new UnauthorizedException(null, "Access denied");
	}

	return user;
}

@Injectable()
export class AdminAuthGuard extends AuthGuard() {
	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		return handleUser(user) as any;
	}
}

@Injectable()
export class GqlAdminAuthGuard extends AuthGuard() {
	getRequest(context: ExecutionContext) {
		const ctx = GqlExecutionContext.create(context);
		return ctx.getContext().req;
	}

	handleRequest(err, user, info, context) {
		if (err) throw new UnauthorizedException();
		return handleUser(user) as any;
	}
}
