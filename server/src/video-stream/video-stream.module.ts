import { Module } from "@nestjs/common";
import { VideoStreamGateway } from "./video-stream.gateway";
import { VideoStreamService } from "./video-stream.service";

@Module({
	providers: [VideoStreamService, VideoStreamGateway],
	exports: [VideoStreamService],
})
export class VideoStreamModule {}
