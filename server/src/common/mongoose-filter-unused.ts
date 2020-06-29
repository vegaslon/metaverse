import { Schema } from "mongoose";

export const MongooseFilterUnused = (schema: Schema<any>) => {
	const fields = Object.keys(schema.paths);
	schema.set("toJSON", {
		transform(doc, ret, options) {
			const result = {};
			Object.keys(ret).map(key => {
				if (fields.includes(key)) {
					result[key] = ret[key];
				}
			});
			return result;
		},
	});
};
