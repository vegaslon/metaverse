import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { DomainModule } from "../domain/domain.module";
import { UserController } from "./user.controller";
import { UserSchema } from "./user.schema";
import { UserService } from "./user.service";
import { UserSettingsSchema } from "./user-settings.schema";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: "user", schema: UserSchema },
			{ name: "user.settings", schema: UserSettingsSchema },
		]),
		forwardRef(() => AuthModule),
		forwardRef(() => DomainModule),
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
