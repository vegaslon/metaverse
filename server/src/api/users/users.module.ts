import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { UsersController } from "./users.controller";
import { UserModule } from "../../user/user.module";
import { DomainModule } from "../../domain/domain.module";

@Module({
	imports: [AuthModule, UserModule, DomainModule],
	controllers: [UsersController],
})
export class ApiUsersModule {}
