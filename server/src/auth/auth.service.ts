import {
	Injectable,
	ConflictException,
	InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserService } from "../user/user.service";
import { AuthTokenDto, AuthSignUpDto } from "./auth.dto";
import { JwtPayload } from "./jwt.strategy";
import { User } from "../user/user.schema";

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

	async login(user: User) {
		const jwt = this.jwtService.sign({
			//username: user.username,
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
		};
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

	async changeImage(user: User, image: any) {}
}
