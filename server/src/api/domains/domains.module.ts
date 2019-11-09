import { Module } from "@nestjs/common";
import { DomainModule } from "../../domain/domain.module";
import { DomainsController } from "./domains.controller";
import { AuthModule } from "../../auth/auth.module";

@Module({
	imports: [AuthModule, DomainModule],
	controllers: [DomainsController],
})
export class ApiDomainsModule {}
