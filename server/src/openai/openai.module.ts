import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OpenaiTokenSchema } from "./openai.schema";
import { OpenaiService } from "./openai.service";
import { OpenaiController } from "./openai.controller";

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: "openai.tokens",
				schema: OpenaiTokenSchema,
				collection: "openai.tokens",
			},
		]),
	],
	providers: [OpenaiService],
	controllers: [OpenaiController],
	exports: [OpenaiService],
})
export class OpenaiModule {}
