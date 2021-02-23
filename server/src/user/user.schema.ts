import { Field, HideField, ObjectType } from "@nestjs/graphql";
import { ObjectId } from "bson";
import { Document, Schema, Types } from "mongoose";
import { MongooseFilterUnused } from "../common/mongoose-filter-unused";
import { Domain, GqlDomain } from "../domain/domain.schema";

export const UserSchema = new Schema({
	username: { type: String, required: true },

	email: { type: String, required: true },
	emailVerified: { type: Boolean, default: false },

	banned: { type: Boolean, default: false },

	emailVerifySecret: { type: String, default: "" },
	resetPasswordSecret: { type: String, default: "" },

	domains: {
		type: [{ type: Schema.Types.ObjectId, ref: "domains" }],
		required: true,
	},

	admin: { type: Boolean, default: false },
	hash: { type: String, requred: true, select: false },
	publicKey: { type: String, default: "" },

	domainLikes: {
		type: [{ type: Schema.Types.ObjectId, ref: "domains" }],
	},

	friends: [{ type: Schema.Types.ObjectId, ref: "users" }],

	supporter: { type: Boolean, default: false },
	dev: { type: Boolean, default: false },
	nametag: {
		type: new Schema(
			{
				displayName: { type: String, default: "" },
				genderPronoun: { type: String, default: "" },
			},
			{ _id: false },
		),
		default: {},
	},

	maxFilesSize: { type: Number, default: 1 }, // 1 GB for free

	created: { type: Date, default: () => new Date() },
	minutes: { type: Number, default: 0 },
});

export interface User extends Document {
	_id: ObjectId;

	username: string;

	email: string;
	emailVerified: boolean;

	banned: boolean;

	emailVerifySecret: string;
	resetPasswordSecret: string;

	domains: Types.Array<Domain>;

	admin: boolean;
	hash: string;
	publicKey: string;

	domainLikes: Types.Array<Domain>;

	friends: Types.Array<User>;

	supporter: boolean;
	dev: boolean;
	nametag: {
		displayName: string;
		genderPronoun: string;
	};

	maxFilesSize: number;

	created: Date;
	minutes: number;
}

@ObjectType("UserNametag")
class GqlUserNametag {
	displayName: string;
	genderPronoun: string;
}

@ObjectType("User")
export class GqlUser {
	_id: string;

	username: string;

	email: string;
	emailVerified: boolean;

	banned: boolean;

	emailVerifySecret: string;
	resetPasswordSecret: string;

	domains: GqlDomain[];

	admin: boolean;
	@HideField()
	hash: string;
	publicKey: string;

	domainLikes: GqlDomain[];

	friends: GqlUser[];

	supporter: boolean;
	dev: boolean;
	nametag: GqlUserNametag;

	maxFilesSize: number;

	created: Date;
	minutes: number;
}

MongooseFilterUnused(UserSchema);
