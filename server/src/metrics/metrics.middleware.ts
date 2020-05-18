import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
	constructor(private readonly metricsService: MetricsService) {}

	use(req: Request, res: Response, next: () => void) {
		res.addListener("finish", () => {
			this.metricsService.metrics.totalReqPerMinute++;

			if (res.statusCode >= 500) {
				this.metricsService.metrics.req5xxPerMinute++;
			} else if (res.statusCode >= 400) {
				this.metricsService.metrics.req4xxPerMinute++;
			}
		});
		next();
	}
}
