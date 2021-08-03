let instances = "max";

if (process.env.INSTANCES != null) {
	const n = parseInt(process.env.INSTANCES);
	if (!Number.isNaN(n)) instances = n;
}

module.exports = {
	apps: [
		{
			script: "dist/main.js",
			instances,
		},
	],
};
