import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { VideoStreamModule } from "../video-stream/video-stream.module";
import { AdminController } from "./admin.controller";
import { DomainModule } from "../domain/domain.module";
import { SessionModule } from "../session/session.module";

@Module({
	imports: [
		AuthModule,
		UserModule,
		DomainModule,
		VideoStreamModule,
		SessionModule,
	],
	controllers: [AdminController],
})
export class AdminModule {}
