import {
	Controller,
	Get,
	Header,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { DEV, METRICS_SECRET } from "../environment";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
	constructor(private readonly metricsService: MetricsService) {}

	@Get()
	@Header("content-type", "text/plain")
	getMetrics(@Req() req: Request) {
		if (!DEV) {
			const auth = req.headers.authorization;
			if (METRICS_SECRET && auth !== "Bearer " + METRICS_SECRET)
				throw new UnauthorizedException();
		}

		return this.metricsService.generatePrometheusMetrics();
	}
}
