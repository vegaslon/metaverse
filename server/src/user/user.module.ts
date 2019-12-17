import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { JWT_SECRET } from "src/environment";
import { AuthModule } from "../auth/auth.module";
import { DomainModule } from "../domain/domain.module";
import { UserSettingsSchema } from "./user-settings.schema";
import { UserController } from "./user.controller";
import { UserSchema } from "./user.schema";
import { UserService } from "./user.service";
import { EmailModule } from "../email/email.module";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: "users", schema: UserSchema, collection: "users" },
			{
				name: "users.settings",
				schema: UserSettingsSchema,
				collection: "users.settings",
			},
		]),
		JwtModule.register({
			secret: JWT_SECRET,
			signOptions: {
				noTimestamp: true,
			},
		}),
		forwardRef(() => AuthModule),
		forwardRef(() => DomainModule),
		EmailModule,
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
