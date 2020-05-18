import { Document, Query, Schema } from "mongoose";
import { generateRandomString } from "../common/utils";
import os from "os";

export const MetricsSchema = new Schema({
	// _id: { type: String, default: () => generateRandomString(16) },
	_id: { type: String, default: () => os.hostname() },

	totalReqPerMinute: { type: Number, default: 0 },
	req4xxPerMinute: { type: Number, default: 0 },
	req5xxPerMinute: { type: Number, default: 0 },

	loginsPerMinute: { type: Number, default: 0 },

	fileReadsPerMinute: { type: Number, default: 0 },
	fileWritesPerMinute: { type: Number, default: 0 },

	expireAt: { type: Date, required: true },
});

export interface Metrics extends Document {
	totalReqPerMinute: number;
	req4xxPerMinute: number;
	req5xxPerMinute: number;

	loginsPerMinute: number;

	fileReadsPerMinute: number;
	fileWritesPerMinute: number;

	expireAt: Date | number;
}

MetricsSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
MetricsSchema.pre(/^find/, function () {
	if (this instanceof Query) this.where({ expireAt: { $gt: Date.now() } });
});
MetricsSchema.pre("aggregate", function () {
	this.pipeline().unshift({
		$match: { expireAt: { $gt: new Date(Date.now()) } },
	});
});
