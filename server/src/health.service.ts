import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
	DiskHealthIndicator,
	DNSHealthIndicator,
	MemoryHealthIndicator,
	MongooseHealthIndicator,
	TerminusEndpoint,
	TerminusModuleOptions,
	TerminusOptionsFactory,
} from "@nestjs/terminus";
import { Connection } from "mongoose";

@Injectable()
export class HealthService implements TerminusOptionsFactory {
	constructor(
		private readonly dns: DNSHealthIndicator,
		@InjectConnection() private mongooseConnection: Connection,
		private readonly mongoose: MongooseHealthIndicator,
		private readonly memory: MemoryHealthIndicator,
		private readonly disk: DiskHealthIndicator,
	) {}

	createTerminusOptions(): TerminusModuleOptions {
		const healthEndpoint: TerminusEndpoint = {
			url: "/health",
			healthIndicators: [
				async () =>
					this.dns.pingCheck(
						"spaces",
						"https://nyc3.digitaloceanspaces.com",
					),
				async () =>
					this.mongoose.pingCheck("mongoose", {
						connection: this.mongooseConnection,
					}),
				//async () => this.memory.checkRSS("memory", 150 * 1024 * 1024),
				// async () => this.disk.checkStorage("disk", {}),
			],
		};

		return {
			endpoints: [healthEndpoint],
		};
	}
}
