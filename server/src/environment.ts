export const {
	URL = "http://127.0.0.1:3000",
	DEV = false,

	WWW_PATH = "",

	DB_HOST = "localhost",
	DB_USER = "",
	DB_PASS = "",
	DB_NAME = "metaverse",

	EMAIL_USER = "",
	EMAIL_PASS = "",
	EMAIL_NAME = "",

	FILES_URL = "http://files.localhost:3000",
	FILES_GCP_PROJECT_ID = "tivolicloud",
	FILES_GCP_BUCKET = "tivolicloud-dev",
	// https://console.cloud.google.com/apis/credentials/wizard?api=storage-api.googleapis.com
	FILES_GCP_AUTH_JSON_PATH = "/home/maki/Downloads/tivolicloud-864353b24743.json",

	JWT_SECRET = "thisIsSoVerySecretyou literally have no idealol1610239012",

	// https://console.cloud.google.com/apis/credentials
	AUTH_GOOGLE_ID = " ",
	AUTH_GOOGLE_SECRET = " ",

	// https://discordapp.com/developers/applications
	AUTH_DISCORD_ID = " ",
	AUTH_DISCORD_SECRET = " ",

	// https://github.com/settings/developers
	AUTH_GITHUB_ID = " ",
	AUTH_GITHUB_SECRET = " ",
} = process.env;
