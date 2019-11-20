import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { DomainSchema } from "./domain.schema";
import { DomainService } from "./domain.service";
import { UserDomainController } from "./user-domain.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
	imports: [
		forwardRef(() => AuthModule),
		MongooseModule.forFeature([{ name: "Domain", schema: DomainSchema }]),
		UserModule,
	],
	providers: [DomainService],
	exports: [DomainService],
	controllers: [UserDomainController],
})
export class DomainModule {}
