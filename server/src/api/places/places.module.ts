import { Module } from "@nestjs/common";
import { DomainModule } from "../../domain/domain.module";
import { PlacesController } from "./places.controller";
import { UserModule } from "../../user/user.module";
import { SessionModule } from "../../session/session.module";

@Module({
	imports: [DomainModule, UserModule, SessionModule],
	controllers: [PlacesController],
})
export class ApiPlacesModule {}
