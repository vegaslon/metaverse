import {
	BadRequestException,
	ConflictException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as mailchecker from "mailchecker";
import { generateRandomString } from "../common/utils";
import { Domain } from "../domain/domain.schema";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { AuthExtSignUpDto, AuthSignUpDto, AuthTokenDto } from "./auth.dto";
import { JwtPayload, JwtPayloadType } from "./jwt.strategy";
import { HOSTNAME } from "../environment";

// aaah... cant camel case here
export interface InterfaceAuthToken {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
	scope: "owner";
	token_type: "Bearer";
}

export interface AuthRegisterToken {
	token: string;
	username: string;
	imageUrl: string;
}

interface JwtRegisterPayload {
	email: string;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
	) {}

	async hashPassword(password: string): Promise<string> {
		try {
			return await bcrypt.hash(password, 12);
		} catch (err) {
			throw new InternalServerErrorException("Failed to hash password");
		}
	}

	async validateUser(authTokenDto: AuthTokenDto) {
		const user = await this.userService
			.findByUsernameOrEmail(authTokenDto.username)
			.select("+hash");

		if (user == null) return null;

		const valid = await bcrypt.compare(authTokenDto.password, user.hash);
		if (!valid) return null;

		return user;
	}

	login(user: User) {
		const jwt = this.jwtService.sign(
			{
				t: JwtPayloadType.USER,
				id: user._id,
			} as JwtPayload,
			{
				expiresIn: "30d",
			},
		);

		const payload = this.jwtService.decode(jwt) as {
			exp: number;
		};

		const iat = Math.floor(+new Date() / 1000);

		return {
			access_token: jwt,
			created_at: iat,
			expires_in: payload.exp - iat,
			refresh_token: "",
			scope: "owner",
			token_type: "Bearer",
		} as InterfaceAuthToken;
	}

	async signUp(authSignUpDto: AuthSignUpDto) {
		if (!mailchecker.isValid(authSignUpDto.email))
			throw new BadRequestException("Invalid email address");

		if (
			(await this.userService.findByUsername(authSignUpDto.username)) !=
			null
		)
			throw new ConflictException("Username already exists");

		if ((await this.userService.findByEmail(authSignUpDto.email)) != null)
			throw new ConflictException("Email already exists");

		const hash = await this.hashPassword(authSignUpDto.password);
		const user = await this.userService.createUser(authSignUpDto, hash);

		return this.login(user);
	}

	async externalSignUp(authExtSignUpDto: AuthExtSignUpDto) {
		const { token, username, imageUrl } = authExtSignUpDto;

		if ((await this.userService.findByUsernameOrEmail(username)) != null)
			throw new ConflictException("Username already exists");

		const tokenPayload = this.jwtService.decode(
			token,
		) as JwtRegisterPayload;

		const email = tokenPayload.email;

		if ((await this.userService.findByUsernameOrEmail(email)) != null)
			throw new ConflictException("Email already exists");

		const user = await this.userService.createUser(
			{
				username,
				email,
				password: "",
			},
			"",
			true,
		);
		await this.userService.changeUserImageFromUrl(user, imageUrl);

		return this.login(user);
	}

	async externalLogin(email: string, username: string, imageUrl: string) {
		const user = await this.userService.findByEmail(email);
		if (user != null) return { user };

		// create temporary jwt token so user can pick username before registering
		const token = this.jwtService.sign({
			email,
		} as JwtRegisterPayload);

		return {
			register: {
				token,
				username,
				email,
				imageUrl,
			} as AuthRegisterToken,
		};
	}

	// domain authentication

	async newDomainToken(user: User, domain: Domain) {
		const s = generateRandomString();

		domain.secret = s;
		await domain.save();

		return this.jwtService.sign({
			t: JwtPayloadType.DOMAIN,
			id: domain._id,
			s,
		} as JwtPayload);
	}

	// sso

	async ssoGitlabToken(user: User) {
		return this.jwtService.sign(
			{
				//id: user.id,
				name: user.username,
				username: user.username.toLowerCase(),
				email: user.email,
				avatar_url:
					HOSTNAME +
					"/api/user/" +
					user.username.toLowerCase() +
					"/image",
			},
			{
				algorithm: "HS256",
				expiresIn: 3600,
				noTimestamp: false,
			},
		);
	}
}
