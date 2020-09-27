import { Document, Model, Query, Schema } from "mongoose";
import * as uuid from "uuid";
import { MongooseFilterUnused } from "../common/mongoose-filter-unused";
import { Domain } from "../domain/domain.schema";
import { User } from "../user/user.schema";

export const UserSessionSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: "users", required: true },
	sessionId: { type: String, default: () => uuid.v4() },

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

	expireAt: Date | number;
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

	expireAt: Date | number;
}

// enable expire which reaps every 60 seconds by default
// and before find, filter out already expired
// /^find/ includes .countDocuments
// TODO: check if .countDocuments is respecting down below
[UserSessionSchema, DomainSessionSchema].forEach(schema => {
	MongooseFilterUnused(schema);

	schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
	schema.pre(/^find/, function () {
		if (this instanceof Query)
			this.where({ expireAt: { $gt: Date.now() } });
	});
	schema.pre("aggregate", function () {
		this.pipeline().unshift({
			$match: { expireAt: { $gt: new Date(Date.now()) } },
		});
	});
});

// before domain find, clean up userSessions
DomainSessionSchema.pre(/^find/, async function (next) {
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
								$and: [
									{
										$gt: [
											"$$session.expireAt",
											new Date(Date.now()),
										],
									},
									{ $eq: ["$$session.domain", _id] },
								],
							},
						},
					},
				},
			},
		]);

		if (docs.length === 1) await model.updateOne({ _id }, docs[0]);

		// this only happens to one domain at a time
	} catch (err) {}

	next();
});
