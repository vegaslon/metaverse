import { Document, Schema } from "mongoose";
import { Domain } from "../domain/domain.schema";

export const UserSchema = new Schema({
	username: { type: String, required: true },

	email: { type: String, required: true },
	emailVerified: { type: Boolean, default: false },

	emailVerifySecret: { type: String, default: "" },
	resetPasswordSecret: { type: String, default: "" },

	domains: {
		type: [{ type: String, ref: "domains" }],
		required: true,
	},

	admin: { type: Boolean, default: false },
	hash: { type: String, requred: true, select: false },
	publicKey: { type: String, default: "" },

	domainLikes: [{ type: String, ref: "domains" }],

	friends: [{ type: Schema.Types.ObjectId, ref: "users" }],
	friendRequests: [{ type: Schema.Types.ObjectId, ref: "users" }],

	created: { type: Date, default: () => new Date() },
	minutes: { type: Number, default: 0 },
});

export interface User extends Document {
	username: string;

	email: string;
	emailVerified: boolean;

	emailVerifySecret: string;
	resetPasswordSecret: string;

	domains: Domain[];

	admin: boolean;
	hash: string;
	publicKey: string;

	domainLikes: Domain[];

	friends: User[];
	friendRequests: User[];

	created: Date;
	minutes: number;
}
