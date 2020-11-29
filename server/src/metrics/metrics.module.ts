import { Module, MiddlewareConsumer } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { MetricsMiddleware } from "./metrics.middleware";
import { MongooseModule } from "@nestjs/mongoose";
import { MetricsSchema } from "./metrics.schema";
import { MetricsController } from "./metrics.controller";
import { SessionModule } from "../session/session.module";

@Module({
	// imports: [
	// 	MongooseModule.forFeature([
	// 		{
	// 			name: "metrics",
	// 			schema: MetricsSchema,
	// 			collection: "metrics",
	// 		},
	// 	]),
	// 	SessionModule,
	// ],
	providers: [MetricsService],
	exports: [MetricsService],
	// controllers: [MetricsController],
})
export class MetricsModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(MetricsMiddleware).forRoutes("");
	}
}
