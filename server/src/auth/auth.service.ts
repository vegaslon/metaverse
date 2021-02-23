import {
	BadRequestException,
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { Field, ObjectType } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as mailchecker from "mailchecker";
import { generateRandomString } from "../common/utils";
import { Domain } from "../domain/domain.schema";
import { MetricsService } from "../metrics/metrics.service";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { AuthExtSignUpDto, AuthSignUpDto, AuthTokenDto } from "./auth.dto";
import { JwtPayload, JwtPayloadType } from "./jwt.strategy";

// aaah... cant camel case here

@ObjectType()
export class InterfaceAuthToken {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
	@Field(() => String)
	scope: "owner";
	@Field(() => String)
	token_type: "Bearer";
}

export interface AuthRegisterToken {
	token: string;
	username: string;
	email: string;
	imageUrl: string;
}

interface JwtRegisterPayload {
	email: string;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,

		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,

		private readonly metricsService: MetricsService,
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

	login(user: User): InterfaceAuthToken {
		const payload: JwtPayload = {
			t: JwtPayloadType.USER,
			id: user._id.toHexString(),
		};
		const jwt = this.jwtService.sign(payload, {
			expiresIn: "30d",
		});

		const decodedPayload = this.jwtService.decode(jwt) as {
			exp: number;
		};

		const iat = Math.floor(+new Date() / 1000);

		this.metricsService.metrics.loginsPerMinute++;

		return {
			access_token: jwt,
			created_at: iat,
			expires_in: decodedPayload.exp - iat,
			refresh_token: "",
			scope: "owner",
			token_type: "Bearer",
		};
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

	async externalLogin(
		email: string,
		username: string,
		imageUrl: string,
	): Promise<{ register: AuthRegisterToken } | { user: User }> {
		const user = await this.userService.findByEmail(email);
		if (user != null) return { user };

		// create temporary jwt token so user can pick username before registering
		const payload: JwtRegisterPayload = {
			email,
		};
		const token = this.jwtService.sign(payload);

		return {
			register: {
				token,
				username,
				email,
				imageUrl,
			},
		};
	}

	// domain authentication

	async newDomainToken(user: User, domain: Domain) {
		const s = generateRandomString();

		domain.secret = s;
		await domain.save();

		const payload: JwtPayload = {
			t: JwtPayloadType.DOMAIN,
			id: domain._id.toHexString(),
			s,
		};
		return this.jwtService.sign(payload);
	}

	// sso

	ssoGitlabToken(user: User) {
		return this.jwtService.sign(
			{
				// id: user.id,
				name: user.username,
				username: user.username.toLowerCase(),
				email: user.email,
				avatar_url:
					URL + "/api/user/" + user.username.toLowerCase() + "/image",
			},
			{
				algorithm: "HS256",
				expiresIn: 3600,
				noTimestamp: false,
			},
		);
	}
}
