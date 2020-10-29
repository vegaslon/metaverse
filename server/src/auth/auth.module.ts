import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { DomainModule } from "../domain/domain.module";
import { JWT_SECRET } from "../environment";
import { MetricsModule } from "../metrics/metrics.module";
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
import { SsoAuthController } from "./sso-auth-controller";

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
		MetricsModule,
	],
	controllers: [OauthController, AuthController, SsoAuthController],
	providers: [AuthService, JwtStrategy, ...strategies],
	exports: [PassportModule, JwtStrategy, AuthService],
})
export class AuthModule {}
