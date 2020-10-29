import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { User } from "../user/user.schema";
import { MetaverseAuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./user.decorator";

// @Injectable()
// class SsoMetaverseAuthGuard extends MetaverseAuthGuard {
// 	handleRequest(err, user, info, context) {

// 			super.handleRequest(err, user, info, context);

// 	}
// }

@ApiTags("auth")
@Controller("auth")
export class SsoAuthController {
	constructor(private readonly authService: AuthService) {}

	// gitlab sso
	// TODO: replace with oauth
	@Get("sso/gitlab")
	@UseGuards(MetaverseAuthGuard)
	@ApiBearerAuth()
	ssoGitlab(@CurrentUser() user: User, @Res() res: Response) {
		const token = this.authService.ssoGitlabToken(user);
		res.redirect(
			"https://git.tivolicloud.com/users/auth/jwt/callback?jwt=" + token,
		);
	}
}
