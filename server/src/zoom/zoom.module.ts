import { Module } from "@nestjs/common";
import { ZoomController } from "./zoom.controller";

@Module({
	controllers: [ZoomController],
})
export class ZoomModule {}
