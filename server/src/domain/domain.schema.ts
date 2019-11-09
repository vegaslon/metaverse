import { Schema, Document } from "mongoose";

enum DomainRestriction {
	acl = "acl", // whitelist
	hifi = "hifi", // whitelist, logged in
	open = "open", // whitelist, logged in, anonymous
}

export const DomainSchema = new Schema({
	_id: { type: String, required: true },

	iceServerAddress: { type: String, default: "" },
	//cloudDomain: { type: Boolean, default: false },
	automaticNetworking: { type: String, default: "none" },

	networkAddress: { type: String, default: "" },
	networkPort: { type: String, default: "40102" },
	online: { type: Boolean, default: true },

	// -- not present in domain/:id put|post request
	defaultPlaceName: { type: String, default: "" },
	ownerPlaces: { type: [String], default: [] },
	label: { type: String, default: "" },
	// --

	description: { type: String, default: "" },
	capacity: { type: Number, default: 0 },
	restricted: { type: Boolean, default: true },
	maturity: { type: String, default: "unrated" },
	hosts: { type: [String], default: [] },
	tags: { type: [String], default: [] },

	version: { type: String, default: "" },
	protocol: { type: String, default: "" },

	onlineUsers: { type: Number, default: 0 },
	onlineAnonUsers: { type: Number, default: 0 },

	publicKey: { type: String, default: "" },
});

export interface Domain extends Document {
	iceServerAddress: string;
	//cloudDomain: boolean;
	automaticNetworking: string;

	networkAddress: string;
	networkPort: string;
	online: boolean;

	defaultPlaceName: string;
	ownerPlaces: string[];
	label: string;

	description: string;
	capacity: number;
	restricted: boolean;
	maturity: string;
	hosts: string;
	tags: string[];

	version: string;
	protocol: string;

	onlineUsers: number;
	onlineAnonUsers: number;

	publicKey: string;
}
