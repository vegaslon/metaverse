import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserSchema } from "./user.schema";
import { AuthModule } from "../auth/auth.module";
import { DomainService } from "../domain/domain.service";

@Module({
	imports: [
		MongooseModule.forFeature([{ name: "User", schema: UserSchema }]),
		forwardRef(() => AuthModule),
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
