import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { VideoStreamModule } from "../video-stream/video-stream.module";
import { AdminController } from "./admin.controller";

@Module({
	imports: [AuthModule, UserModule, VideoStreamModule],
	controllers: [AdminController],
})
export class AdminModule {}
