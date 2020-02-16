import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserModule } from "../../user/user.module";
import { AuthModule } from "../../auth/auth.module";
import { SessionModule } from "../../session/session.module";

@Module({
	imports: [AuthModule, UserModule, SessionModule],
	controllers: [UserController],
})
export class ApiUserModule {}
