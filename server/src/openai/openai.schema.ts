import { ObjectId } from "bson";
import { Document, Schema } from "mongoose";
import { MongooseFilterUnused } from "../common/mongoose-filter-unused";
import { generateRandomString } from "../common/utils";

export const OpenaiTokenSchema = new Schema({
	token: {
		type: String,
		default: () => generateRandomString(32, true, true, true),
	},
	name: { type: String, default: "" },

	totalCalls: { type: Number, default: 0 },
	totalEstTokens: { type: Number, default: 0 },

	monthly: { type: Map, default: new Map() },

	created: { type: Date, default: () => new Date() },
});

export interface OpenaiToken extends Document {
	_id: ObjectId;

	token: string;
	name: string;

	totalCalls: number;
	totalEstTokens: number;

	monthly: Map<string, { calls: number; estTokens: number }>;

	created: Date;
}

MongooseFilterUnused(OpenaiTokenSchema);
