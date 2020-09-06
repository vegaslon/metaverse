import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
	DiskHealthIndicator,
	DNSHealthIndicator,
	HealthCheck,
	HealthCheckService,
	MemoryHealthIndicator,
	MongooseHealthIndicator,
} from "@nestjs/terminus";
import { Connection } from "mongoose";

@Controller("health")
export class HealthController {
	constructor(
		private readonly health: HealthCheckService,
		private readonly dns: DNSHealthIndicator,
		@InjectConnection() private mongooseConnection: Connection,
		private readonly mongoose: MongooseHealthIndicator,
		private readonly memory: MemoryHealthIndicator,
		private readonly disk: DiskHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			// async () =>
			// 	this.dns.pingCheck(
			// 		"spaces",
			// 		"https://nyc3.digitaloceanspaces.com",
			// 	),
			async () =>
				this.mongoose.pingCheck("mongoose", {
					connection: this.mongooseConnection,
				}),
			// async () => this.memory.checkRSS("memory", 150 * 1024 * 1024),
			// async () => this.disk.checkStorage("disk", {}),
		]);

		// TODO: check if / frontend is working
	}
}
