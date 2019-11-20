import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JWT_SECRET } from "../environment";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import {
	DiscordStrategy,
	GitHubStrategy,
	GoogleStrategy,
} from "./external.strategy";
import { JwtStrategy } from "./jwt.strategy";
import { OauthController } from "./oauth.controller";
import { DomainModule } from "../domain/domain.module";

const strategies = [GoogleStrategy, DiscordStrategy, GitHubStrategy];

@Module({
	imports: [
		PassportModule.register({
			defaultStrategy: "jwt",
		}),
		JwtModule.register({
			secret: JWT_SECRET,
			signOptions: {
				noTimestamp: true,
			},
		}),
		forwardRef(() => UserModule),
		forwardRef(() => DomainModule),
	],
	controllers: [OauthController, AuthController],
	providers: [AuthService, JwtStrategy, ...strategies],
	exports: [PassportModule, JwtStrategy, AuthService],
})
export class AuthModule {}
