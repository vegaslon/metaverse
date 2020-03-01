// import { Injectable, OnModuleInit } from "@nestjs/common";
// import { FtpSrv, FileSystem, FtpConnection } from "ftp-srv";
// import { FilesService } from "./files.service";
// import { AuthService } from "../auth/auth.service";
// import { AuthTokenGrantType, AuthTokenScope } from "../auth/auth.dto";
// import { User } from "../user/user.schema";
// import * as path from "path";
// import { Writable } from "stream";
// import { Buffer } from "buffer";
// import * as mime from "mime-types";
// import fetch from "node-fetch";

// class UserFileSystem extends FileSystem {
// 	private currentWorkingDirectory = "/";

// 	private files: {
// 		key: string;
// 		lastModified: Date;
// 		size: number;
// 		url: string;
// 	}[] = null;

// 	async refreshFiles() {
// 		this.files = await this.filesService.getFiles(
// 			this.user,
// 			this.currentWorkingDirectory,
// 		);
// 	}

// 	constructor(
// 		connection: FtpConnection,
// 		private readonly user: User,
// 		private readonly filesService: FilesService,
// 	) {
// 		super(connection);
// 		this.refreshFiles();
// 	}

// 	currentDirectory() {
// 		return this.currentWorkingDirectory;
// 	}

// 	list(pathStr?: string) {
// 		return new Promise(resolve => {
// 			pathStr =
// 				pathStr == null
// 					? this.currentWorkingDirectory
// 					: path.posix.join("/", pathStr);

// 			const list = () =>
// 				this.files
// 					.filter(file => file.key.startsWith(pathStr)) // only in path
// 					.filter(file => !file.key.includes("/")) // no sub directories
// 					.map(file => ({
// 						name: file.key.replace(pathStr, ""),
// 						size: file.size,
// 						atime: null,
// 						mtime: new Date(file.lastModified),
// 						ctime: new Date(file.lastModified),
// 						birthtime: null,
// 					}));

// 			if (this.files == null) {
// 				const interval = setInterval(() => {
// 					if (this.files == null) return;
// 					clearInterval(interval);
// 					return resolve(list());
// 				}, 500);
// 			} else {
// 				console.log(list());
// 				return resolve(list());
// 			}
// 		});
// 	}

// 	async write(fileName: string) {
// 		const pathStr = path.posix.join(this.currentWorkingDirectory, fileName);

// 		const chunks: Buffer[] = [];
// 		const stream = new Writable({
// 			write: (chunk: Buffer, encoding, next) => {
// 				chunks.push(chunk);
// 				next();
// 			},
// 			final: next => {
// 				this.filesService
// 					.uploadFile(this.user, pathStr, {
// 						buffer: Buffer.concat(chunks),
// 						mimetype:
// 							mime.lookup(fileName) || "application/octet-stream",
// 						originalname: fileName,
// 						fieldname: null,
// 						encoding: null,
// 					})
// 					.then(() => next())
// 					.catch(err => {
// 						next(err);
// 					});
// 			},
// 		});

// 		return { stream };
// 	}

// 	async read(fileName: string) {
// 		const pathStr = path.posix.join(this.currentWorkingDirectory, fileName);

// 		const found = this.files.filter(file => file.key == pathStr);
// 		if (found.length == 0) return new Error("Can't find file");

// 		const res = await fetch(found[0].url);
// 		const stream = res.body;

// 		return { stream };
// 	}
// }

// @Injectable()
// export class FtpService implements OnModuleInit {
// 	private server: FtpSrv;

// 	constructor(
// 		private readonly authService: AuthService,
// 		private readonly filesService: FilesService,
// 	) {}

// 	onModuleInit() {
// 		this.server = new FtpSrv({});

// 		this.server.on(
// 			"login",
// 			({ connection, username, password }, resolve, reject) => {
// 				this.authService
// 					.validateUser({
// 						username,
// 						password,
// 						grant_type: AuthTokenGrantType.password,
// 						scope: AuthTokenScope.owner,
// 					})
// 					.then(user => {
// 						if (user == null) reject();

// 						resolve({
// 							fs: new UserFileSystem(
// 								connection,
// 								user,
// 								this.filesService,
// 							),
// 						});
// 					})
// 					.catch(() => {
// 						reject();
// 					});
// 			},
// 		);

// 		this.server.listen().then(() => {
// 			console.log("ftp server up");
// 		});
// 	}
// }
