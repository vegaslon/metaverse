import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	Res,
	UseGuards,
	Query,
	HttpException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { User } from "../user/user.schema";
import { AuthExtSignUpDto, AuthSignUpDto } from "./auth.dto";
import { MetaverseAuthGuard } from "./auth.guard";
import {
	AuthRegisterToken,
	AuthService,
	InterfaceAuthToken,
} from "./auth.service";
import { CurrentUser } from "./user.decorator";
import { JwtService } from "@nestjs/jwt";

@ApiTags("auth")
@Controller("api/auth")
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly jwtService: JwtService,
	) {}

	@Post("signup")
	async signUp(@Body() authSignUpDto: AuthSignUpDto) {
		return this.authService.signUp(authSignUpDto);
	}

	@Post("signup-external")
	async externalSignUp(@Body() authExtSignUpDto: AuthExtSignUpDto) {
		return this.authService.externalSignUp(authExtSignUpDto);
	}

	// external
	@Get("google")
	@UseGuards(AuthGuard("google"))
	google() {}

	@ApiExcludeEndpoint()
	@Get("google/callback")
	@UseGuards(AuthGuard("google"))
	googleCallback(@Req() req: Request, @Res() res: Response) {
		this.handleExternalLogin(req, res);
	}

	@Get("discord")
	@UseGuards(AuthGuard("discord"))
	discord() {}

	@ApiExcludeEndpoint()
	@Get("discord/callback")
	@UseGuards(AuthGuard("discord"))
	discordCallback(@Req() req: Request, @Res() res: Response) {
		this.handleExternalLogin(req, res);
	}

	@Get("github")
	@UseGuards(AuthGuard("github"))
	github() {}

	@ApiExcludeEndpoint()
	@Get("github/callback")
	@UseGuards(AuthGuard("github"))
	githubCallback(@Req() req: Request, @Res() res: Response) {
		this.handleExternalLogin(req, res);
	}

	handleExternalLogin(req: Request, res: Response) {
		const auth = req.user as any;

		let token: InterfaceAuthToken = null;
		let register: AuthRegisterToken = null;

		if (auth.user != null) {
			token = this.authService.login(auth.user as User);
		} else if (auth.register != null) {
			register = auth.register;
		}

		const json = JSON.stringify({ token, register });

		res.send(
			`<script>if(window.opener)window.opener.postMessage(${json},"*")</script>`,
		);
	}

	// gitlab sso
	// TODO: replace with oauth
	@Post("sso/gitlab")
	@UseGuards(MetaverseAuthGuard)
	@ApiBearerAuth()
	ssoGitlab(@CurrentUser() user: User) {
		return this.authService.ssoGitlabToken(user);
	}

	// oauth for fider. has been moved to frontend.
	// TODO: implement oauth properly everywhere
	// https://aaronparecki.com/oauth-2-simplified

	// private clientIdRedirects = {
	// 	// roadmap: "https://roadmap.tivolicloud.com/oauth/_7nshkpqggo/callback",
	// 	roadmap: "http://fider.localhost:3000/oauth/_bmy4sdlqxx/callback",
	// };

	// @Get("oauth/authorize")
	// oauthAuthorize(
	// 	@Query("response_type") responseType: string,
	// 	@Query("client_id") clientId: string,
	// 	// @Query("redirect_uri") redirectUri: string,
	// 	@Query("scope") scope: string,
	// 	@Query("state") state: string,
	// 	@Req() req: Request,
	// 	@Res() res: Response,
	// ) {
	// 	const error = (message: string) =>
	// 		res
	// 			.status(401)
	// 			.json({
	// 				error: "invalid_request",
	// 				error_message: message,
	// 			})
	// 			.end();

	// 	if (responseType !== "code") return error("Response type not code");
	// 	if (Object.keys(this.clientIdRedirects).includes(clientId) === false)
	// 		return error("Unknown client id");

	// 	if (req.cookies.auth != null) {
	// 		try {
	// 			const { access_token } = JSON.parse(req.cookies.auth);
	// 			const redirect = new URL(this.clientIdRedirects[clientId]);
	// 			redirect.searchParams.set("code", access_token);
	// 			redirect.searchParams.set("state", state);
	// 			res.redirect(redirect.href);
	// 		} catch (err) {
	// 			return error("Invalid Tivoli auth token");
	// 		}
	// 	} else {

	// 		return error("Not authenticated to Tivoli");
	// 	}
	// }

	// @Post("sso/fider")
	// oauthToken(
	// 	@Body("grant_type") grantType: string,
	// 	@Body("code") code: string,
	// 	@Body("redirect_uri") redirectUri: string,
	// 	@Body("client_id") clientId: string,
	// 	@Body("client_secret") clientSecret: string,
	// ) {
	// 	const error = (message: string) =>
	// 		new HttpException(
	// 			{
	// 				error: "invalid_request",
	// 				error_message: message,
	// 			},
	// 			401,
	// 		);

	// 	if (grantType !== "authorization_code")
	// 		throw error("Grant type not authorization code");
	// 	if (clientSecret !== "headbone") throw error("Incorrect client secret");

	// 	const payload = this.jwtService.decode(code) as { exp: number };

	// 	return {
	// 		access_token: code,
	// 		expires_in: payload.exp == null ? -1 : payload.exp,
	// 	};
	// }
}
