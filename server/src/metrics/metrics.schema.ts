import { Document, Query, Schema } from "mongoose";
import { MongooseFilterUnused } from "../common/mongoose-filter-unused";

export const MetricsSchema = new Schema({
	_id: { type: String },

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

MongooseFilterUnused(MetricsSchema);

MetricsSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
MetricsSchema.pre(/^find/, function () {
	if (this instanceof Query) this.where({ expireAt: { $gt: Date.now() } });
});
MetricsSchema.pre("aggregate", function () {
	this.pipeline().unshift({
		$match: { expireAt: { $gt: new Date(Date.now()) } },
	});
});
