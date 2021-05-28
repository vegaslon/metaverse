module.exports = {
	apps: [
		{
			script: "dist/main.js",
			instances: parseInt(process.env.INSTANCES) ?? "max",
		},
	],
};
