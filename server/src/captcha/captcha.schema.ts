import { Document, Query, Schema } from "mongoose";
import { MongooseFilterUnused } from "../common/mongoose-filter-unused";
import { generateRandomString } from "../common/utils";

export const CaptchaSchema = new Schema({
	_id: { type: String, default: () => generateRandomString(16) },

	image: { type: Buffer, required: true },
	result: { type: String, required: true },

	// 5 minutes
	expireAt: { type: Date, default: () => Date.now() + 1000 * 60 * 5 },
});

export interface Captcha extends Document {
	_id: string;

	image: Buffer;
	result: string;

	expireAt: Date | number;
}

// enable expire which reaps every 60 seconds by default
// and before find, filter out already expired
// /^find/ includes .countDocuments
// TODO: check if .countDocuments is respecting down below

MongooseFilterUnused(CaptchaSchema);

CaptchaSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
CaptchaSchema.pre(/^find/, function () {
	if (this instanceof Query) this.where({ expireAt: { $gt: Date.now() } });
});
CaptchaSchema.pre("aggregate", function () {
	this.pipeline().unshift({
		$match: { expireAt: { $gt: new Date(Date.now()) } },
	});
});
