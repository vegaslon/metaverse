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

	monthly: { type: Object, default: {} },

	created: { type: Date, default: () => new Date() },
});

export interface OpenaiToken extends Document {
	_id: ObjectId;

	token: string;
	name: string;

	monthly: {
		[monthKey: string]: {
			calls: number;
			tokens: { [engine: string]: number };
		};
	};

	created: Date;
}

MongooseFilterUnused(OpenaiTokenSchema);
