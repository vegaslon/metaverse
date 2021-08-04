// TODO: plausible died

// const filename = "66c2e6a0f3149850fd26.js";
// const url = "https://plausible.tivolicloud.com/js/plausible.js";

// const fetch = require("node-fetch");
// const path = require("path");
// const fs = require("fs");

// (async () => {
// 	const res = await fetch(url);
// 	if (!res.ok) {
// 		console.error("Failed to fetch Plausible js file");
// 		process.exit(1);
// 	}

// 	let js = await res.text();
// 	js = js.replace(`[src*="'+r+'"]`, `[src*="${filename}"]`);

// 	const pathToJs = path.resolve(__dirname, "./src/" + filename);
// 	fs.writeFileSync(pathToJs, js);

// 	console.log("Successfully written " + pathToJs);
// })();
