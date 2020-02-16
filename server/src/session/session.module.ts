import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DomainModule } from "../domain/domain.module";
import { UserModule } from "../user/user.module";
import { DomainSessionSchema, UserSessionSchema } from "./session.schema";
import { SessionService } from "./session.service";

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: "users.sessions",
				schema: UserSessionSchema,
				collection: "users.sessions",
			},
			{
				name: "domains.sessions",
				schema: DomainSessionSchema,
				collection: "domains.sessions",
			},
		]),
		//forwardRef(() => UserModule),
		//forwardRef(() => DomainModule),
	],
	controllers: [],
	providers: [SessionService],
	exports: [SessionService],
})
export class SessionModule {}
