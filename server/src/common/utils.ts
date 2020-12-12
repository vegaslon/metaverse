import baseX from "base-x";
import { ObjectId } from "bson";
import mimeTypes from "mime-db";
import { Types } from "mongoose";
import { Readable } from "stream";
import * as uuid from "uuid";
import { Domain, DomainRestriction } from "../domain/domain.schema";
import { URL, WORLD_URL } from "../environment";
import { DomainSession, UserSession } from "../session/session.schema";
import { User } from "../user/user.schema";

const base62 = baseX(
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

export function snakeToCamelCase(snake: string) {
	const split = snake.split("_");

	return split
		.map((word, i) => {
			word = word.toLowerCase();

			if (i == 0) return word;
			return word.slice(0, 1).toUpperCase() + word.slice(1);
		})
		.join("");
}

export function snakeToCamelCaseObject(snakeObject: Object) {
	let camelObject = {};

	const snakeKeys = Object.keys(snakeObject);

	for (let snakeKey of snakeKeys) {
		const camelKey = snakeToCamelCase(snakeKey);

		camelObject[camelKey] = snakeObject[snakeKey];
	}

	return camelObject;
}

export function patchObject(object: Object, patches: Object, keys?: string[]) {
	const objectKeys = keys == null ? Object.keys(object) : keys;
	const patchKeys = Object.keys(patches);

	for (let key of patchKeys) {
		if (!objectKeys.includes(key)) continue;
		object[key] = patches[key];
	}

	return object;
}

export function patchDoc(doc: object, patches: object) {
	patchObject(doc, patches, Object.keys((doc as any)._doc));
	return doc;
}

export function pagination<T>(
	current_page: number,
	per_page: number,
	entries: T[],
) {
	// page 1 is the minimum
	current_page = current_page <= 0 ? 1 : current_page;

	const startIndex = per_page * (current_page - 1);
	const data = entries.slice(startIndex, startIndex + per_page);

	const total_pages = Math.ceil(entries.length / per_page);
	const total_entries = entries.length;

	return {
		info: {
			current_page,
			per_page,
			total_pages,
			total_entries,
		},
		data,
	};
}

// function testPagination() {
// 	const test = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
// 	console.log(pagination(0, 5, test));
// 	console.log(pagination(1, 5, test));
// 	console.log(pagination(2, 5, test));
// 	console.log(pagination(3, 5, test));
// 	console.log(pagination(4, 5, test));
// 	console.log(pagination(5, 5, test));
// }

export function generateRandomString(
	length = 32,
	small = true,
	big = true,
	numbers = true,
) {
	let out = "";
	let chars = "";

	if (small) chars += "abcdefghijklmnopqrstuvwxyz";
	if (big) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	if (numbers) chars += "0123456789";

	for (let i = 0; i < length; i++) {
		out += chars[Math.floor(Math.random() * chars.length)];
	}

	return out;
}

export function renderDomainForHifi(d: Domain, session?: DomainSession) {
	// TODO: this is insecure and deprecated

	const online = session != null;

	return {
		id: objectIdToUuid(d._id),
		_id: d._id,

		...(d.automaticNetworking === "full"
			? {
					ice_server_address: d.iceServerAddress,
			  }
			: {
					network_address: d.networkAddress,
					network_port: d.networkPort,
			  }),

		cloud_domain: false,
		online,

		default_place_name: objectIdToUuid(d._id),
		owner_places: d.ownerPlaces,
		label: d.label, // tivoli
		author: d.author.username, // tivoli

		description: d.description,
		capacity: d.capacity,
		restriction: d.restriction,
		maturity: d.maturity,
		hosts: d.hosts,
		tags: d.tags,

		version: d.version,
		protocol: d.protocol,

		online_users: online ? session.onlineUsers : 0,
		online_anonymous_users: null,
	};
}

export function renderDomain(
	domain: Domain,
	session: DomainSession,
	currentUser: User,
) {
	if (domain.restriction === DomainRestriction.acl) {
		if (currentUser == null) return null;
		if (domain.author._id + "" !== currentUser._id + "") {
			if (
				domain.whitelist
					.map(users => users + "")
					.includes((currentUser._id + "") as any) === false
			) {
				return null;
			}
		}
	}

	const liked =
		currentUser == null
			? false
			: currentUser.domainLikes.some(likedDomain => {
					if (typeof likedDomain == "string") {
						return likedDomain == domain._id;
					} else if (typeof likedDomain == "object") {
						return (
							(typeof (likedDomain as any).toHexString ==
							"function"
								? (likedDomain as any).toHexString()
								: likedDomain._id) == domain._id
						);
					}
			  });

	const online = session != null;
	const usingIce = domain.automaticNetworking === "full";

	return {
		id: objectIdToUuid(domain._id), // TODO: needs to eventually become _id
		_id: domain._id,
		label: domain.label,
		username: domain.author.username, // TODO deprecated, use author
		author: domain.author.username,
		description: domain.description,
		restriction: domain.restriction,
		maturity: domain.maturity,

		online,
		numUsers: online ? session.onlineUsers : 0,

		likes: domain.userLikes.length,
		liked,

		iceServerAddress: usingIce ? domain.iceServerAddress : "",
		networkAddress: usingIce ? "" : domain.networkAddress,
		networkPort: usingIce ? "" : domain.networkPort,

		protocol: domain.protocol,
		version: domain.version,

		path: domain.path,
		url: WORLD_URL + "/" + encodeObjectId(domain._id),
	};
}

export function renderFriend(user: User, userSession: UserSession) {
	const domain = userSession.domain;
	const showDomain = domain == null ? false : domain.restriction != "acl";

	return {
		username: user.username,
		online: userSession != null,
		trusted: false,
		image: URL + "/api/user/" + user.username + "/image",
		domain: showDomain
			? {
					id: domain._id,
					name: domain.label,
			  }
			: null,
	};
}

export const displayPlural = (n: number, singular: string, plural?: string) =>
	n + " " + (n === 1 ? singular : plural != null ? plural : singular + "s");

export const displayPluralName = (name: string) =>
	name.toLowerCase().endsWith("s") ? name + "'" : name + "'s";

export const encodeObjectId = (objectId: ObjectId) =>
	base62.encode(Buffer.from(objectId.toHexString(), "hex").reverse());

export const decodeObjectId = (shortObjectId: string) =>
	base62.decode(shortObjectId).reverse().toString("hex");

export const streamToBuffer = async (
	stream: Readable | NodeJS.ReadableStream,
) => {
	const chunks = [];
	stream.on("data", chunk => {
		chunks.push(chunk);
	});

	await new Promise((resolve, reject) => {
		stream.on("end", resolve);
		stream.on("error", reject);
	});

	return Buffer.concat(chunks);
};

export const getMimeType = (filename: string) => {
	const ext = filename.split(".").pop().toLowerCase();

	if (ext == "ts") return "text/typescript";
	if (ext == "fst") return "text/plain";

	const mimeType = Object.entries(mimeTypes).find(
		(data: [string, { extensions?: string[] }]) =>
			data[1].extensions != null && data[1].extensions.includes(ext),
	);

	if (mimeType == null) {
		return "application/octet-stream";
	} else {
		return mimeType[0];
	}
};

export const objectIdToUuid = (objectId: ObjectId) => {
	const objectIdBuffer = Buffer.from(objectId.toHexString(), "hex");

	// xx xx xx xx - xx xx - [1-5]x xx - [89ab]x xx - xx xx xx xx xx x

	const uuidBuffer = Buffer.from([
		objectIdBuffer[0],
		objectIdBuffer[1],
		objectIdBuffer[2],
		objectIdBuffer[3],
		// -
		objectIdBuffer[4],
		objectIdBuffer[5],
		// -
		0x10,
		0x0,
		// -
		0x80,
		0x0,
		// -
		objectIdBuffer[6],
		objectIdBuffer[7],
		objectIdBuffer[8],
		objectIdBuffer[9],
		objectIdBuffer[10],
		objectIdBuffer[11],
	]);

	return uuid.stringify(uuidBuffer);
};

export const uuidToObjectId = (uuidStr: string) => {
	const uuidBuffer = Buffer.from(uuid.parse(uuidStr));

	const objectIdBuffer = Buffer.from([
		uuidBuffer[0],
		uuidBuffer[1],
		uuidBuffer[2],
		uuidBuffer[3],
		// -
		uuidBuffer[4],
		uuidBuffer[5],
		// -
		// 0x10
		// 0x0
		// -
		// 0x80
		// 0x0
		// -
		uuidBuffer[10],
		uuidBuffer[11],
		uuidBuffer[12],
		uuidBuffer[13],
		uuidBuffer[14],
		uuidBuffer[15],
	]);

	return new ObjectId(objectIdBuffer.toString("hex"));
};

export const docInsideDocArray = <T>(
	array: Types.Array<T>,
	id: ObjectId | string,
) => {
	const idStr = typeof id == "object" ? id.toHexString() : id;
	return array.some(doc => {
		if (typeof doc == "object") {
			if (typeof (doc as any).toHexString == "function") {
				return idStr == (doc as any).toHexString();
			} else if ((doc as any)._id != null) {
				return idStr == (doc as any)._id;
			}
		} else if (typeof doc == "string") {
			return idStr == doc;
		}
	});
};
