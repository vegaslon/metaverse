import { Document, Schema } from "mongoose";

export const UserSettingsSchema = new Schema({
	interface: { type: Object, required: true },
	avatarBookmarks: { type: Object, required: true },
});

export interface UserSettings extends Document {
	interface: any;
	avatarBookmarks: any;
}
