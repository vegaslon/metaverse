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
			{ name: "users", schema: UserSchema, collection: "users" },
			{
				name: "users.settings",
				schema: UserSettingsSchema,
				collection: "users.settings",
			},
		]),
		forwardRef(() => AuthModule),
		forwardRef(() => DomainModule),
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
