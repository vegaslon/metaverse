import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { DomainSchema } from "./domain.schema";
import { DomainService } from "./domain.service";
import { UserDomainController } from "./user-domain.controller";
import { AuthModule } from "../auth/auth.module";
import { DomainController } from "./domain.controller";
import { SessionModule } from "../session/session.module";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: "domains", schema: DomainSchema, collection: "domains" },
		]),
		forwardRef(() => AuthModule),
		forwardRef(() => UserModule),
		forwardRef(() => SessionModule),
	],
	controllers: [UserDomainController, DomainController],
	providers: [DomainService],
	exports: [DomainService],
})
export class DomainModule {}
