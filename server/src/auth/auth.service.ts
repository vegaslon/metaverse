import {
	Injectable,
	ConflictException,
	InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserService } from "../user/user.service";
import { AuthTokenDto, AuthSignUpDto, AuthExtSignUpDto } from "./auth.dto";
import { JwtPayload } from "./jwt.strategy";
import { User } from "../user/user.schema";

// aaah... cant camel case here
export interface AuthToken {
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
		const jwt = this.jwtService.sign({
			id: user._id,
		} as JwtPayload);

		const payload = this.jwtService.decode(jwt) as {
			iat: number;
			exp: number;
		};

		return {
			access_token: jwt,
			created_at: payload.iat,
			expires_in: payload.exp - payload.iat,
			refresh_token: "",
			scope: "owner",
			token_type: "Bearer",
		} as AuthToken;
	}

	async signUp(authSignUpDto: AuthSignUpDto) {
		if (
			(await this.userService.findByUsernameOrEmail(
				authSignUpDto.username,
			)) != null
		)
			throw new ConflictException("Username already exists");

		if (
			(await this.userService.findByUsernameOrEmail(
				authSignUpDto.email,
			)) != null
		)
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
}
