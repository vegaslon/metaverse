import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { UsersController } from "./users.controller";
import { UserModule } from "../../user/user.module";
import { DomainModule } from "../../domain/domain.module";
import { SessionModule } from "../../session/session.module";

@Module({
	imports: [AuthModule, UserModule, DomainModule, SessionModule],
	controllers: [UsersController],
})
export class ApiUsersModule {}
