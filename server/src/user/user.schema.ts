import { Document, Schema } from "mongoose";
import { Domain } from "../domain/domain.schema";

export const UserSchema = new Schema({
	username: { type: String, required: true },
	email: { type: String, required: true },
	image: { type: Buffer, default: null },

	domains: {
		type: [{ type: String, ref: "Domain" }],
		required: true,
	},

	admin: { type: Boolean, default: false },
	hash: { type: String, requred: true, select: false },
	publicKey: { type: String, default: "" },

	minutes: { type: Number, default: 0 },
});

export interface User extends Document {
	username: string;
	email: string;
	image: Buffer;

	domains: Domain[];

	admin: boolean;
	hash: string;
	publicKey: string;

	minutes: number;
}
