import { Document, Schema } from "mongoose";
import { Domain } from "../domain/domain.schema";

export const UserSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: true },

	domains: {
		type: [{ type: String, ref: "domain" }],
		required: true,
	},

	admin: { type: Boolean, default: false },
	hash: { type: String, requred: true, select: false },
	publicKey: { type: String, default: "" },

	created: { type: Date, default: new Date() },
	minutes: { type: Number, default: 0 },
});

export interface User extends Document {
	username: string;
	email: string;

	domains: Domain[];

	admin: boolean;
	hash: string;
	publicKey: string;

	created: Date;
	minutes: number;
}
