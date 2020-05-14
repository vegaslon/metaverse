import { Document, Schema } from "mongoose";
import { User } from "../user/user.schema";
import { v4 as uuid } from "uuid";

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

export const DomainSchema = new Schema(
	{
		_id: { type: String, default: () => uuid() },
		lastUpdated: { type: Date, default: new Date() },

		author: { type: Schema.Types.ObjectId, ref: "users", required: true },
		secret: { type: String, default: "" }, // require for jwt auth

		iceServerAddress: { type: String, default: "" },
		//cloudDomain: { type: Boolean, default: false },
		automaticNetworking: {
			type: String,
			enum: Object.values(DomainAutomaticNetworking),
			default: DomainAutomaticNetworking.disabled,
		},

		networkAddress: { type: String, default: "" },
		networkPort: { type: Number, default: 40102 },

		description: { type: String, default: "" },
		capacity: { type: Number, default: 0 },
		restriction: {
			type: String,
			enum: Object.values(DomainRestriction),
			default: DomainRestriction.acl,
		},
		whitelist: [{ type: Schema.Types.ObjectId, ref: "users" }],
		maturity: { type: String, default: "unrated" },
		hosts: { type: [String], default: [] },
		tags: { type: [String], default: [] },

		version: { type: String, default: "" },
		protocol: { type: String, default: "" },

		publicKey: { type: String, default: "" },

		// not from hifi
		label: { type: String, default: "" },
		path: { type: String, default: "" }, // if empty, domain server will handle path
		ownerPlaces: { type: [String], default: [] }, // not really sure  [{id, name, path}]
		userLikes: [{ type: Schema.Types.ObjectId, ref: "users" }],
	},
	{
		skipVersioning: {
			whitelist: true,
			userLikes: true,
		},
	},
);

export interface Domain extends Document {
	lastUpdated: Date;

	author: User;
	secret: string;

	iceServerAddress: string;
	//cloudDomain: boolean;
	automaticNetworking: DomainAutomaticNetworking;

	networkAddress: string;
	networkPort: number;

	description: string;
	capacity: number;
	restriction: DomainRestriction;
	whitelist: User[];
	maturity: string;
	hosts: string;
	tags: string[];

	version: string;
	protocol: string;

	publicKey: string;

	// not from hifi
	label: string;
	path: string;
	ownerPlaces: string[];
	userLikes: User[];
}

DomainSchema.pre("remove", async function (next) {
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
