import { Document, Schema, Model, Query } from "mongoose";
import { Domain } from "../domain/domain.schema";
import { User } from "../user/user.schema";
import uuid = require("uuid");

export const UserSessionSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: "users", required: true },
	sessionId: { type: String, default: () => uuid() },

	minutes: { type: Number, default: 0 },
	createdAt: { type: Date, default: () => new Date() },

	path: { type: String, default: null },
	domain: { type: String, ref: "domains" },
	nodeId: { type: String, default: null },
	// networkAddress: { type: String, default: null },
	// networkPort: { type: String, default: null },

	expireAt: { type: Date, required: true },
});

export interface UserSession extends Document {
	user: User;
	sessionId: string;

	minutes: number;
	createdAt: Date;

	path: string;
	domain: Domain;
	nodeId: string;

	expireAt: Date;
}

export const DomainSessionSchema = new Schema({
	_id: { type: String, required: true },
	domain: { type: String, ref: "domains", required: true },

	onlineUsers: { type: Number, default: 0 }, // what the domain reports
	userSessions: [{ type: Schema.Types.ObjectId, ref: "users.sessions" }],

	expireAt: { type: Date, required: true },
});

export interface DomainSession extends Document {
	domain: Domain;

	onlineUsers: number;
	userSessions: UserSession[];

	expireAt: Date;
}

// before find, delete all expired (countDocuments included)
[UserSessionSchema, DomainSessionSchema].forEach(schema => {
	schema.pre(/^find/, async function(next) {
		try {
			const model = (this as any).model as Model<any, {}>;

			const deleted = await model.deleteMany({
				expireAt: { $lt: new Date().valueOf() },
			});
		} catch (err) {}

		next();
	});
});

// before domain find, clean up userSessions
DomainSessionSchema.pre(/^find/, async function(next) {
	try {
		const model = (this as any).model as Model<DomainSession, {}>;
		const _id = (this as any)._conditions._id;

		const docs = await model.aggregate<DomainSession>([
			{ $match: { _id } },
			{
				$lookup: {
					from: "users.sessions",
					localField: "userSessions",
					foreignField: "_id",
					as: "userSessions",
				},
			},
			{
				$project: {
					userSessions: {
						$filter: {
							input: "$userSessions",
							as: "session",
							cond: {
								$eq: ["$$session.domain", _id],
							},
						},
					},
				},
			},
		]);

		if (docs.length == 1) await model.updateOne({ _id }, docs[0]);

		// this only happens to one domain at a time
	} catch (err) {}

	next();
});
