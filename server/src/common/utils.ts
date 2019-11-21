import { Domain } from "../domain/domain.schema";
import { DomainSession } from "../domain/domain.service";
import { HeartbeatSession } from "./heartbeat";

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
}

export function patchDoc(doc: Object, patches: Object) {
	patchObject(doc, patches, Object.keys((doc as any)._doc));
}

export function pagination(
	current_page: number,
	per_page: number,
	entries: any[],
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

export function renderDomain(
	d: Domain,
	session: DomainSession & HeartbeatSession,
) {
	const online = session == null;
	const online_users = session == null ? 0 : session.numUsers;
	const online_anonymous_users = session == null ? 0 : session.numAnonUsers;

	return {
		id: d._id,

		ice_server_address: d.iceServerAddress,
		cloud_domain: false,

		network_address: d.networkAddress,
		network_port: d.networkPort,
		online,

		default_place_name: d.defaultPlaceName,
		owner_places: d.ownerPlaces,
		label: d.label, // probobaly shouldnt

		description: d.description,
		capacity: d.capacity,
		restriction: d.restriction,
		maturity: d.maturity,
		hosts: d.hosts,
		tags: d.tags,

		version: d.version,
		protocol: d.protocol,

		online_users,
		online_anonymous_users,
	};
}