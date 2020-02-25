export const {
	HOSTNAME = "http://127.0.0.1:3000",
	DEV = false,

	WWW_PATH = "",

	DB_HOST = "localhost",
	DB_USER = "",
	DB_PASS = "",
	DB_NAME = "metaverse",

	EMAIL_USER = "",
	EMAIL_PASS = "",
	EMAIL_NAME = "",

	FILES_S3_URL = "",
	FILES_S3_BUCKET = "",
	FILES_S3_ENDPOINT = "nyc3.digitaloceanspaces.com",
	FILES_S3_KEY_ID = "",
	FILES_S3_SECRET_KEY = "",

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
