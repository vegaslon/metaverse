import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { DomainSchema } from "./domain.schema";
import { DomainService } from "./domain.service";

@Module({
	imports: [
		MongooseModule.forFeature([{ name: "Domain", schema: DomainSchema }]),
		UserModule,
	],
	providers: [DomainService],
	exports: [DomainService],
})
export class DomainModule {}
