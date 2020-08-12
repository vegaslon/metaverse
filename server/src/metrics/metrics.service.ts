import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Metrics } from "./metrics.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import os from "os";
import { DEV } from "../environment";
import { SessionService } from "../session/session.service";
import { generateRandomString } from "../common/utils";

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
	private intervals: NodeJS.Timeout[] = [];

	metrics: Metrics;

	constructor(
		@InjectModel("metrics") private readonly metricsModel: Model<Metrics>,
		private readonly sessionService: SessionService,
	) {}

	private generateMetricsID() {
		return os.hostname() + "-" + generateRandomString(8);
	}

	async updateDatebase(isNewMinute = false) {
		if (
			this.metrics == null ||
			this.metricsModel.findOne({ id: this.metrics.id }) == null
		) {
			this.metrics = new this.metricsModel({
				_id: this.generateMetricsID(),
			});
		}

		this.metrics.expireAt = Date.now() + 1000 * 60;
		await this.metrics.save();

		if (isNewMinute) {
			this.metrics.totalReqPerMinute = 0;
			this.metrics.req4xxPerMinute = 0;
			this.metrics.req5xxPerMinute = 0;

			this.metrics.loginsPerMinute = 0;

			this.metrics.fileReadsPerMinute = 0;
			this.metrics.fileWritesPerMinute = 0;
		}
	}

	async generatePrometheusMetrics() {
		const metricsInfoMap: {
			key: string;
			help: string;
			type: "counter" | "gauge";
			values: {
				labels?: { [key: string]: string };
				dataKey?: keyof Metrics;
				data?: number;
			}[];
		}[] = [
			{
				key: "requests",
				help: "Total number of HTTP requests",
				type: "counter",
				values: [
					{
						labels: { code: "all" },
						dataKey: "totalReqPerMinute",
					},
					{
						labels: { code: "4xx" },
						dataKey: "req4xxPerMinute",
					},
					{
						labels: { code: "5xx" },
						dataKey: "req5xxPerMinute",
					},
				],
			},
			{
				key: "logins",
				help: "Total user logins",
				type: "counter",
				values: [
					{
						dataKey: "loginsPerMinute",
					},
				],
			},
			{
				key: "files",
				help: "Total files being read or written",
				type: "counter",
				values: [
					{
						labels: { type: "read" },
						dataKey: "fileReadsPerMinute",
					},
					{
						labels: { type: "write" },
						dataKey: "fileWritesPerMinute",
					},
				],
			},
			{
				key: "sessions",
				help: "Total online sessions",
				type: "gauge",
				values: [
					{
						labels: { type: "domains" },
						data: await this.sessionService.getDomainCount(),
					},
					{
						labels: { type: "users" },
						data: await this.sessionService.getUserCount(),
					},
					{
						labels: { type: "metaverses" },
						data: await this.metricsModel.countDocuments(),
					},
				],
			},
		];

		const allMetrics = await this.metricsModel.find({});
		const lastMinuteMs = +new Date().setSeconds(0, 0);

		let out = "";

		for (const info of metricsInfoMap) {
			const { key, help, type, values } = info;

			out += `# HELP ${key} ${help}\n`;
			out += `# TYPE ${key} ${type}\n`;

			for (const value of values) {
				const labels = value.labels
					? Object.keys(value.labels).map(
							key => `${key}="${value.labels[key]}"`,
					  )
					: [];

				const data =
					value.data == null
						? allMetrics.reduce(
								(current, doc) =>
									doc[value.dataKey] == null
										? current
										: current + doc[value.dataKey],
								0,
						  )
						: value.data;

				out += `${key}`;
				if (labels.length > 0) out += `{${labels.join(",")}}`;
				out += ` ${data}`;
				if (type === "counter") out += ` ${lastMinuteMs}`;

				out += "\n";
			}

			out += "\n";
		}

		return out;
	}

	async onModuleInit() {
		await this.updateDatebase();

		this.intervals.push(
			// every 15 timed seconds, 1 in dev
			setInterval(() => {
				const seconds = new Date(Date.now()).getSeconds();
				if (!DEV && seconds % 15 !== 0) return;

				this.updateDatebase(seconds === 0);
			}, 1000),
		);
	}

	onModuleDestroy() {
		for (const interval of this.intervals) {
			clearInterval(interval);
		}
	}
}
