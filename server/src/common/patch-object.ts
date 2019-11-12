export function patchObject(object: Object, patches: Object) {
	const objectKeys = Object.keys(object);
	const patchKeys = Object.keys(patches);

	for (let key of patchKeys) {
		if (!objectKeys.includes(key)) continue;
		object[key] = patches[key];
	}
}
