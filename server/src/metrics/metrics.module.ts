import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MetricsMiddleware } from "./metrics.middleware";
import { MetricsService } from "./metrics.service";

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
