import { Module } from "@nestjs/common";
import { DomainModule } from "../../domain/domain.module";
import { DomainsController } from "./domains.controller";
import { AuthModule } from "../../auth/auth.module";
import { SessionModule } from "../../session/session.module";

@Module({
	imports: [AuthModule, DomainModule, SessionModule],
	controllers: [DomainsController],
})
export class ApiDomainsModule {}
