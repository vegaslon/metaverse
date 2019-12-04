import { Document, Schema } from "mongoose";

export const UserSettingsSchema = new Schema({
	interface: { type: String, required: true },
	avatarBookmarks: { type: String, required: true },
});

export interface UserSettings extends Document {
	interface: string;
	avatarBookmarks: string;
}
