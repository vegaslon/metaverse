import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JWT_SECRET } from "../environment";
import { UserModule } from "../user/user.module";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { OauthController } from "./oauth.controller";
import { AuthController } from "./auth.controller";

@Module({
	imports: [
		PassportModule.register({
			defaultStrategy: "jwt",
		}),
		JwtModule.register({
			secret: JWT_SECRET,
			signOptions: {
				expiresIn: "30d",
			},
		}),
		forwardRef(() => UserModule),
	],
	controllers: [OauthController, AuthController],
	providers: [AuthService, JwtStrategy],
	exports: [PassportModule, JwtStrategy, AuthService],
})
export class AuthModule {}
