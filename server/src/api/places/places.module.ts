import { Module } from "@nestjs/common";
import { DomainModule } from "../../domain/domain.module";
import { PlacesController } from "./places.controller";

@Module({
	imports: [DomainModule],
	controllers: [PlacesController],
})
export class PlacesModule {}
