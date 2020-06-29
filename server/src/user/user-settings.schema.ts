import { Document, Schema } from "mongoose";
import { MongooseFilterUnused } from "../common/mongoose-filter-unused";

export const UserSettingsSchema = new Schema({
	interface: { type: String, required: true },
	avatarBookmarks: { type: String, required: true },
});

export interface UserSettings extends Document {
	interface: string;
	avatarBookmarks: string;
}

MongooseFilterUnused(UserSettingsSchema);
