import { Document, Schema } from "mongoose";
import { Domain } from "../domain/domain.schema";

export const UserSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: true },
	emailVerified: { type: Boolean, default: false },

	domains: {
		type: [{ type: String, ref: "domains" }],
		required: true,
	},

	admin: { type: Boolean, default: false },
	hash: { type: String, requred: true, select: false },
	publicKey: { type: String, default: "" },

	domainLikes: [{ type: String, ref: "domains" }],

	created: { type: Date, required: true },
	minutes: { type: Number, default: 0 },

	online: { type: Boolean, default: false },
	onlineMinutes: { type: Number, default: 0 },
});

export interface User extends Document {
	username: string;
	email: string;
	emailVerified: boolean;

	domains: Domain[];

	admin: boolean;
	hash: string;
	publicKey: string;

	domainLikes: Domain[];

	created: Date;
	minutes: number;

	online: Boolean;
	onlineMinutes: Number;
}
