import fs from "fs";

// environment.dev.ts

// export default {
// 	URL: "http://127.0.0.1:3000",
// };

let environmentDev: object;
if (fs.existsSync(__dirname + "/environment.dev.js")) {
	environmentDev = require("./environment.dev").default;
}

export const {
	URL = "http://127.0.0.1:3000",
	DEV = false,

	WWW_PATH = "",

	DB_URI = "mongodb://localhost",
	DB_NAME = "metaverse",

	EMAIL_HOST = "",
	EMAIL_PORT = "587",
	EMAIL_USER = "",
	EMAIL_PASS = "",
	EMAIL_FROM = "",

	GEOLITE2_CITY_DB = "",

	FILES_URL = "http://files.localhost:3000",
	FILES_GCP_PROJECT_ID = "tivolicloud",
	FILES_GCP_BUCKET = "tivolicloud-dev",
	// https://console.cloud.google.com/apis/credentials/wizard?api=storage-api.googleapis.com
	FILES_GCP_AUTH_JSON = "{}",

	INVENTORY_URL = "http://inventory.localhost:3000",
	INVENTORY_S3_ENDPOINT = "",
	INVENTORY_S3_REGION = "",
	INVENTORY_S3_BUCKET_NAME = "",
	INVENTORY_S3_ACCESS_KEY_ID = "",
	INVENTORY_S3_SECRET_ACCESS_KEY = "",

	WORLD_URL = "http://world.localhost:3000",
	TEA_URL = "http://tea.localhost:3000",

	OPENAI_API_KEY = "",

	JWT_SECRET = "thisIsSoVerySecretyou literally have no idealol1610239012",

	METRICS_SECRET = "",

	// https://console.cloud.google.com/apis/credentials
	AUTH_GOOGLE_ID = " ",
	AUTH_GOOGLE_SECRET = " ",

	// https://discordapp.com/developers/applications
	AUTH_DISCORD_ID = " ",
	AUTH_DISCORD_SECRET = " ",

	// https://github.com/settings/developers
	AUTH_GITHUB_ID = " ",
	AUTH_GITHUB_SECRET = " ",
} = environmentDev ? { ...process.env, ...environmentDev } : process.env;
