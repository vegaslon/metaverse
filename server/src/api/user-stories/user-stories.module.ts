import { Module } from "@nestjs/common";
import { UserStoriesController } from "./user-stories.controller";
import { DomainModule } from "../../domain/domain.module";

@Module({
	imports: [DomainModule],
	controllers: [UserStoriesController],
})
export class ApiUserStoriesModule {}
