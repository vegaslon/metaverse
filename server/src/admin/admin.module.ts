import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { AdminController } from "./admin.controller";

@Module({
	imports: [AuthModule, UserModule],
	controllers: [AdminController],
})
export class AdminModule {}
