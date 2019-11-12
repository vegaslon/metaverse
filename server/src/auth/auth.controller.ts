import {
	Body,
	Controller,
	Post,
	Get,
	UseGuards,
	Req,
	Res,
} from "@nestjs/common";
import { ApiUseTags, ApiExcludeEndpoint } from "@nestjs/swagger";
import { AuthSignUpDto, AuthExtSignUpDto } from "./auth.dto";
import { AuthService, AuthToken, AuthRegisterToken } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { User } from "../user/user.schema";

@ApiUseTags("auth")
@Controller("api/auth")
export class AuthController {
	constructor(private authService: AuthService) {}

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

		let token: AuthToken = null;
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
}
