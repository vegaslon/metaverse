import { Module } from "@nestjs/common";
import { DomainModule } from "../../domain/domain.module";
import { PlacesController } from "./places.controller";
import { UserModule } from "../../user/user.module";

@Module({
	imports: [DomainModule, UserModule],
	controllers: [PlacesController],
})
export class PlacesModule {}
