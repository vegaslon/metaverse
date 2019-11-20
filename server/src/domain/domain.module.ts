import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { DomainSchema } from "./domain.schema";
import { DomainService } from "./domain.service";
import { UserDomainController } from "./user-domain.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
	imports: [
		MongooseModule.forFeature([{ name: "Domain", schema: DomainSchema }]),
		forwardRef(() => AuthModule),
		UserModule,
	],
	providers: [DomainService],
	controllers: [UserDomainController],
	exports: [DomainService],
})
export class DomainModule {}
