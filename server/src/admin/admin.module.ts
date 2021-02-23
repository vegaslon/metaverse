import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DomainModule } from "../domain/domain.module";
import { OpenaiModule } from "../openai/openai.module";
import { SessionModule } from "../session/session.module";
import { UserModule } from "../user/user.module";
import { VideoStreamModule } from "../video-stream/video-stream.module";
import { AdminDomainResolver } from "./admin-domain.resolver";
import { AdminUserResolver } from "./admin-user.resolver";
import { AdminController } from "./admin.controller";

@Module({
	imports: [
		AuthModule,
		UserModule,
		DomainModule,
		VideoStreamModule,
		SessionModule,
		OpenaiModule,
	],
	controllers: [AdminController],
	providers: [AdminUserResolver, AdminDomainResolver],
})
export class AdminModule {}
