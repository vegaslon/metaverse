import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserModule } from "../../user/user.module";
import { AuthModule } from "../../auth/auth.module";

@Module({
	imports: [AuthModule, UserModule],
	controllers: [UserController],
})
export class ApiUserModule {}
