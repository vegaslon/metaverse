import { Document, Schema, Model } from "mongoose";

export const UserFilesCacheSchema = new Schema({
	files: { type: Schema.Types.Mixed, required: true },
	expireAt: { type: Date, required: true },
});

export interface UserFilesCache extends Document {
	files: any[];
	expireAt: Date;
}

UserFilesCacheSchema.pre(/^find/, async function(next) {
	try {
		const model = (this as any).model as Model<UserFilesCache, {}>;

		await model.deleteMany({
			expireAt: { $lt: Date.now() },
		});
	} catch (err) {}

	next();
});
