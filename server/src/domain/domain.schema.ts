import { Document, Schema, MongooseDocumentOptionals } from "mongoose";
import { User } from "../user/user.schema";
import { MongoClient } from "mongodb";

export enum DomainAutomaticNetworking {
	full = "full",
	ip = "ip",
	disabled = "disabled",
}

export enum DomainRestriction {
	acl = "acl", // whitelist
	hifi = "hifi", // whitelist, logged in
	open = "open", // whitelist, logged in, anonymous
}

export const DomainSchema = new Schema({
	_id: { type: String, required: true },
	lastUpdated: { type: Date, default: new Date() },

	author: { type: Schema.Types.ObjectId, ref: "users", required: true },
	secret: { type: String, default: "" }, // require for auth

	iceServerAddress: { type: String, default: "" },
	//cloudDomain: { type: Boolean, default: false },
	automaticNetworking: {
		type: String,
		enum: Object.values(DomainAutomaticNetworking),
		default: DomainAutomaticNetworking.disabled,
	},

	networkAddress: { type: String, default: "" },
	networkPort: { type: String, default: "40102" },

	online: { type: Boolean, default: false },
	onlineUsers: { type: Number, default: 0 },

	// -- not present in domain/:id put|post request
	//defaultPlaceName: { type: String, default: "" },
	ownerPlaces: { type: [String], default: [] },
	label: { type: String, default: "" },
	// --

	description: { type: String, default: "" },
	capacity: { type: Number, default: 0 },
	restriction: {
		type: String,
		enum: Object.values(DomainRestriction),
		default: DomainRestriction.acl,
	},
	maturity: { type: String, default: "unrated" },
	hosts: { type: [String], default: [] },
	tags: { type: [String], default: [] },

	version: { type: String, default: "" },
	protocol: { type: String, default: "" },

	publicKey: { type: String, default: "" },

	// not from hifi
	path: { type: String, default: "/0,0,0/0,0,0,0" },

	userLikes: [{ type: Schema.Types.ObjectId, ref: "users" }],
});

export interface Domain extends Document {
	lastUpdated: Date;

	author: User;
	secret: string;

	iceServerAddress: string;
	//cloudDomain: boolean;
	automaticNetworking: DomainAutomaticNetworking;

	networkAddress: string;
	networkPort: string;

	online: boolean;
	onlineUsers: number;

	//defaultPlaceName: string;
	ownerPlaces: string[]; // [{id, name, path}]
	label: string;

	description: string;
	capacity: number;
	restriction: DomainRestriction;
	maturity: string;
	hosts: string;
	tags: string[];

	version: string;
	protocol: string;

	publicKey: string;

	// not from hifi
	path: string;

	userLikes: User[];
}

DomainSchema.pre("remove", async function(next) {
	try {
		const domain = await (this as Domain)
			.populate("author")
			.populate("userLikes")
			.execPopulate();

		// remove domain from author
		await (async () => {
			const user = domain.author;
			const i = (user.domains as any[]).indexOf(domain._id);
			user.domains.splice(i, 1);
			await user.save();
		})().catch(() => {});

		// remove domain from user's likes
		await (async () => {
			for (let user of domain.userLikes) {
				try {
					const i = (user.domainLikes as any[]).indexOf(domain._id);
					user.domainLikes.splice(i, 1);
					await user.save();
				} catch (err) {}
			}
		})().catch(() => {});

		next();
	} catch (err) {
		next();
	}
});
