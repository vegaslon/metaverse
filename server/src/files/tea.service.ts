import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import crypto from "crypto";
import net from "net";
import { exec as openssl } from "openssl-wrapper";
import { JwtPayload, JwtPayloadType } from "../auth/jwt.strategy";
import { streamToBuffer } from "../common/utils";
import { DEV } from "../environment";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { FilesHostService } from "./files-host.service";

function hash(data: crypto.BinaryLike, algorithm: string) {
	const hashed = crypto.createHash(algorithm);
	hashed.update(data);
	return hashed.digest("hex");
}

@Injectable()
export class TeaService implements OnModuleInit, OnModuleDestroy {
	port = 17486;
	logger = new Logger("TeaServer");
	server: net.Server;

	constructor(
		private readonly filesHostService: FilesHostService,
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
	) {}

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
						if (err) return reject(err);
						resolve(output);
					},
				);
			} catch (err) {
				return reject(err);
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

	private async onSocketData(socket: net.Socket, data: Buffer) {
		let request: { accessToken: string; path: string };

		if (DEV) {
			this.logger.verbose("tea://");
			this.logger.verbose("ip: " + (socket.address() as any).address);
		}

		const decryptedRequest = await this.decrypt(data, "");
		if (Buffer.isBuffer(decryptedRequest) === false) {
			if (DEV) {
				this.logger.verbose("request: " + data.toString("utf-8"));
				this.logger.verbose("Could not decrypt!");
			}
			return socket.destroy();
		}

		const decryptedRequestStr = decryptedRequest.toString("utf-8");
		if (DEV) this.logger.verbose("request: " + decryptedRequestStr);

		// parse request

		try {
			request = JSON.parse(decryptedRequestStr);
		} catch (err) {
			return socket.destroy();
		}

		const accessToken = request.accessToken;
		if (typeof accessToken !== "string") return socket.destroy();

		const path = request.path;
		if (typeof path !== "string") return socket.destroy();

		// authenticate

		let user: User;
		try {
			user = await this.authenticate(accessToken);
		} catch (err) {
			if (DEV) this.logger.verbose("Could not authenticate!");
			return socket.destroy();
		}
		if (DEV) this.logger.verbose("username: " + user.username);

		// get file

		let stream: NodeJS.ReadableStream;
		try {
			stream = await this.filesHostService.getFile(null, path);
		} catch (err) {
			if (DEV) this.logger.verbose("path: " + path + " not found!");
			return socket.destroy();
		}

		// encrypt and write

		const buffer = await streamToBuffer(stream);
		const output = await this.encrypt(buffer, path);

		if (socket.writable) {
			socket.write(output, error => {
				if (error && DEV) this.logger.verbose(error);
				socket.destroy();
			});
		} else if (DEV) {
			this.logger.verbose("Socket not writable!");
		}
	}

	onModuleInit() {
		this.server = net.createServer(socket => {
			socket.on("data", data => {
				try {
					this.onSocketData(socket, data).catch(err => {
						socket.destroy();
					});
				} catch (err) {
					socket.destroy();
				}
			});
		});

		this.server.listen(this.port, "0.0.0.0", () => {
			this.logger.log("Tea server listening on *:" + this.port);
		});
	}

	onModuleDestroy() {
		this.server.close();
	}
}
