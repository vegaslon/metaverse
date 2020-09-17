import {
	HttpException,
	ImATeapotException,
	Injectable,
	Logger,
	NotFoundException,
	OnModuleInit,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import crypto from "crypto";
import { Request, Response } from "express";
import { writeFileSync } from "fs";
import { exec as openssl } from "openssl-wrapper";
import rawBody from "raw-body";
import { JwtPayload, JwtPayloadType } from "../auth/jwt.strategy";
import { streamToBuffer } from "../common/utils";
import { DEV, TEA_URL, URL as METAVERSE_URL } from "../environment";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { FilesHostService } from "./files-host.service";

function hash(data: crypto.BinaryLike, algorithm: string) {
	const hashed = crypto.createHash(algorithm);
	hashed.update(data);
	return hashed.digest("hex");
}

@Injectable()
export class TeaService implements OnModuleInit {
	logger = new Logger("TeaServer");

	constructor(
		private readonly filesHostService: FilesHostService,
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
	) {
		// this.encrypt(
		// 	Buffer.from(
		// 		JSON.stringify({
		// 			path: "maki/Screenshot-20200723163409-1381x886.png",
		// 			accessToken: "",
		// 		}),
		// 	),
		// 	"",
		// ).then(data => {
		// 	writeFileSync("/home/maki/tea-data.raw", data);
		// });
	}

	onModuleInit() {
		this.logger.log("Tea server available at " + TEA_URL);
	}

	private password(seed: string) {
		const a1 = hash("1. " + seed + "y0u", "SHA224");
		const a2 = hash("2. " + seed + "are", "SHA384");
		const a3 = hash("3. " + seed + "bEAUt1ful", "MD4");
		const b1 = hash(
			a3 + "i really l1ke" + a1 + "strawBERRy ch33s3 cAk3" + a2,
			"MD5",
		);
		const b2 = hash(
			a1 + "bUT ONly" + a2 + "w1th wh1pp3d CREAM!" + a3,
			"SHA1",
		);
		const b3 = hash(
			a2 + "i also like" + a1 + "bagels with cream cheese" + a3,
			"SHA256",
		);
		const c1 = hash(
			"oh well" +
				a1 +
				"ill hope you" +
				b2 +
				"never ever" +
				a3 +
				"guess this" +
				b1 +
				"because we're trying to" +
				a2 +
				"protect people's work" +
				b3,
			"SHA512",
		);
		const c2 = hash(
			a3 +
				"sqiurrels" +
				c1 +
				"are" +
				b3 +
				"really" +
				a1 +
				"cute" +
				b2 +
				"and" +
				a2 +
				"foxes" +
				b1 +
				"are" +
				c1 +
				"really" +
				b2 +
				"silly",
			"SHA512",
		);
		return c2 + c1;
	}

	private encrypt(input: Buffer, seed: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				openssl(
					"aes-256-cbc",
					input,
					{
						md: "sha512",
						pbkdf2: true,
						salt: true,
						k: this.password(seed),
					},
					(err, output) => {
						if (err) return reject(err);
						resolve(output);
					},
				);
			} catch (err) {
				return reject(err);
			}
		});
	}

	private decrypt(input: Buffer, seed: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				openssl(
					"aes-256-cbc",
					input,
					{
						d: true,
						md: "sha512",
						pbkdf2: true,
						k: this.password(seed),
					},
					(err, output) => {
						if (err) return resolve(null);
						return resolve(output);
					},
				);
			} catch (err) {
				return resolve(null);
			}
		});
	}

	private async authenticate(accessToken: string): Promise<User> {
		const payload = this.jwtService.decode(accessToken) as JwtPayload;

		if (
			payload.t !== JwtPayloadType.USER ||
			payload.id == null ||
			payload.exp == null
		)
			throw new Error("Invalid token");

		const now = +new Date() / 1000;
		if (now > payload.exp) throw new Error("Expired token");

		const user = await this.userService.findById(payload.id);
		if (user == null) throw new Error("Invalid token");

		return user;
	}

	async getFile(req: Request, res: Response) {
		if (DEV) this.logger.verbose("tea://");

		if (!req.header("user-agent").startsWith("TivoliCloudVR")) {
			if (DEV) {
				this.logger.verbose(
					"Invalid user agent! " + req.header("user-agent"),
				);
			}
			return res.redirect(METAVERSE_URL);
		}

		const body = await rawBody(req, { limit: "1MB" });
		if (body.length <= 0) throw new ImATeapotException();

		let decryptedRequest: Buffer;
		decryptedRequest = await this.decrypt(body, "");
		if (Buffer.isBuffer(decryptedRequest) === false) {
			if (DEV) {
				this.logger.verbose("request: " + body.toString("utf-8"));
				this.logger.verbose("Could not decrypt!");
			}
			throw new ImATeapotException();
		}

		// parse request

		let request: { accessToken: string; path: string };
		try {
			request = JSON.parse(decryptedRequest.toString("utf-8"));
		} catch (err) {
			throw new ImATeapotException();
		}
		if (DEV)
			this.logger.verbose("request: " + JSON.stringify(request, null, 4));

		const accessToken = request.accessToken;
		if (typeof accessToken !== "string") throw new ImATeapotException();

		const path = request.path;
		if (typeof path !== "string") throw new ImATeapotException();

		// authenticate

		let user: User;
		try {
			user = await this.authenticate(accessToken);
		} catch (err) {
			if (DEV) this.logger.verbose("Could not authenticate!");
			throw new ImATeapotException();
		}
		if (DEV) this.logger.verbose("username: " + user.username);

		// get file

		let file: {
			status: number;
			headers: { [key: string]: string };
			body: NodeJS.ReadableStream;
		};
		try {
			file = await this.filesHostService.getFile(req, null, path);
		} catch (err) {
			if (DEV) {
				this.logger.verbose(err);
			}
			if (typeof err == "object" && typeof err.status == "number") {
				throw new HttpException(err.message, err.status);
			} else {
				throw new NotFoundException();
			}
		}

		// encrypt and write

		const buffer = await streamToBuffer(file.body);
		const output = await this.encrypt(buffer, path);

		res.status(file.status);
		for (const header of Object.entries(file.headers)) {
			res.setHeader(header[0], header[1]);
		}

		// force .fst files as text/plain
		if (/\.fst$/i.test(path)) {
			res.setHeader("Content-Type", "text/plain");
		}

		if (req.query.download != null) {
			res.setHeader("Content-Disposition", "attachment");
		}

		res.send(output);

		if (DEV) this.logger.verbose("");
	}
}
