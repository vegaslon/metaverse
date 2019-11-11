import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy as StrategyDiscord } from "passport-discord";
import { Strategy as StrategyGitHub } from "passport-github";
import { Strategy as StrategyGoogle } from "passport-google-oauth20";
import {
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	HOSTNAME,
	AUTH_DISCORD_ID,
	AUTH_DISCORD_SECRET,
} from "../environment";
import { User } from "../user/user.schema";
import { AuthRegisterToken, AuthService } from "./auth.service";

function handleLogin(
	login:
		| { user: User; register?: undefined }
		| { register: AuthRegisterToken; user?: undefined },
	done: Function,
) {
	if (login.user != null) {
		return done(null, { user: login.user });
	}

	if (login.register != null) {
		return done(null, {
			register: login.register,
		});
	}

	done(null, false);
}

function transformUsername(username: string) {
	return username.replace(/[^a-zA-Z0-9\.\_]+/, "");
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(StrategyGoogle, "google") {
	constructor(private authService: AuthService) {
		super({
			clientID: AUTH_GOOGLE_ID,
			clientSecret: AUTH_GOOGLE_SECRET,
			callbackURL: HOSTNAME + "/api/auth/google/callback",

			passReqToCallback: true,
			scope: ["profile", "email"],
		});
	}

	async validate(
		request: any,
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: Function,
	) {
		const email = profile.emails[0].value;
		const username = profile.emails[0].value.split("@")[0]; // profile.displayname
		const imageUrl = profile.photos[0].value;

		handleLogin(
			await this.authService.externalLogin(
				email,
				transformUsername(username),
				imageUrl,
			),
			done,
		);
	}
}

@Injectable()
export class DiscordStrategy extends PassportStrategy(
	StrategyDiscord,
	"discord",
) {
	constructor(private authService: AuthService) {
		super({
			clientID: AUTH_DISCORD_ID,
			clientSecret: AUTH_DISCORD_SECRET,
			callbackURL: HOSTNAME + "/api/auth/discord/callback",

			passReqToCallback: true,
			scope: ["identify", "email"],
		});
	}

	async validate(
		request: any,
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: Function,
	) {
		const email = profile.email;
		const username = profile.username;
		const imageUrl =
			"https://cdn.discordapp.com/avatars/" +
			profile.id +
			"/" +
			profile.avatar +
			".png?size=512";

		handleLogin(
			await this.authService.externalLogin(
				email,
				transformUsername(username),
				imageUrl,
			),
			done,
		);
	}
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(StrategyGitHub, "github") {
	constructor(private authService: AuthService) {
		super({
			clientID: AUTH_GITHUB_ID,
			clientSecret: AUTH_GITHUB_SECRET,
			callbackURL: HOSTNAME + "/api/auth/github/callback",

			passReqToCallback: true,
		});
	}

	async validate(
		request: any,
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: Function,
	) {
		const email = profile.emails[0].value;
		const username = profile.username;
		const imageUrl = profile.photos[0].value;

		handleLogin(
			await this.authService.externalLogin(
				email,
				transformUsername(username),
				imageUrl,
			),
			done,
		);
	}
}
