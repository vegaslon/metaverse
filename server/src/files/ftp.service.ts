// import { Injectable, OnModuleInit } from "@nestjs/common";
// import * as fs from "fs";
// import { FileSystem, FtpConnection, FtpSrv } from "ftp-srv";
// import fetch from "node-fetch";
// import * as path from "path";
// import { AuthTokenGrantType, AuthTokenScope } from "../auth/auth.dto";
// import { AuthService } from "../auth/auth.service";
// import { Folder, KeyedFileSystem } from "../common/keyed-file-system";
// import { User } from "../user/user.schema";
// import { FilesService } from "./files.service";

// class UserFileSystem extends FileSystem {
// 	private easyStat(
// 		name: string,
// 		isFolder: boolean,
// 		size: number,
// 		updated: Date,
// 	): fs.Stats & { name: string } {
// 		return {
// 			name,

// 			// https://nodejs.org/api/fs.html#fs_class_fs_stats
// 			isFile: () => !isFolder,
// 			isDirectory: () => isFolder,
// 			isBlockDevice: () => false,
// 			isCharacterDevice: () => false,
// 			isSymbolicLink: () => false,
// 			isFIFO: () => false,
// 			isSocket: () => false,

// 			dev: 0, // The numeric identifier of the device containing the file.
// 			ino: 0, // The file system specific "Inode" number for the file.
// 			mode: parseInt("755", 8),
// 			nlink: 0, // The number of hard-links that exist for the file.
// 			uid: 1, // The numeric user identifier of the user that owns the file (POSIX).
// 			gid: 1, // The numeric group identifier of the group that owns the file (POSIX).
// 			rdev: 0, // A numeric device identifier if the file is considered "special".
// 			size: size, // The size of the file in bytes.
// 			blksize: 4096, // The file system block size for i/o operations.
// 			blocks: size * (1 / 512), // The number of blocks allocated for this file.

// 			atimeMs: 0,
// 			mtimeMs: +updated,
// 			ctimeMs: +updated,
// 			birthtimeMs: 0,

// 			atime: null, // Last accessed
// 			mtime: updated, // Last modified
// 			ctime: updated, // Last changed
// 			birthtime: null, // Created
// 		};
// 	}

// 	private fs = new KeyedFileSystem();

// 	private rootFolder: Folder;
// 	private currentFolder: Folder;

// 	constructor(
// 		connection: FtpConnection,
// 		private readonly user: User,
// 		private readonly filesService: FilesService,
// 	) {
// 		super(connection);
// 	}

// 	async refreshFiles() {
// 		const files = await this.filesService.getFiles(this.user, "/");

// 		this.rootFolder = this.fs.init(files);

// 		this.currentFolder =
// 			this.currentFolder == null
// 				? this.rootFolder
// 				: this.rootFolder.traverseForFolder(
// 						this.currentFolder.absolutePath(),
// 				  ) || this.rootFolder;
// 	}

// 	private pathStrAsRoot(pathStr = ".") {
// 		return pathStr.startsWith("/")
// 			? pathStr
// 			: path.posix.join(this.currentDirectory(), pathStr);
// 	}

// 	// https://www.npmjs.com/package/ftp-srv#methods

// 	currentDirectory() {
// 		console.log("cwd", this.currentFolder.absolutePath());
// 		return this.currentFolder.absolutePath();
// 	}

// 	async get(fileName: string) {
// 		console.log("get", fileName);

// 		const pathStr = this.pathStrAsRoot(fileName);

// 		const isFolder = KeyedFileSystem.pathStrIsFolder(pathStr);

// 		if (isFolder) {
// 			const foundFolder = this.rootFolder.traverseForFolder(pathStr);

// 			return this.easyStat(foundFolder.name, true, 0, null);
// 		} else {
// 			const foundFile = this.rootFolder.traverseForFile<{
// 				size: number;
// 				updated: Date;
// 			}>(pathStr);

// 			return this.easyStat(
// 				foundFile.name,
// 				false,
// 				foundFile.metadata.size,
// 				foundFile.metadata.updated,
// 			);
// 		}
// 	}

// 	async list(pathStr = ".") {
// 		console.log("list", pathStr);

// 		pathStr = this.pathStrAsRoot(pathStr);

// 		const output: (fs.Stats & { name: string })[] = [];

// 		const foundFolder = this.rootFolder.traverseForFolder(pathStr);
// 		if (foundFolder == null) return null;

// 		for (const folder of foundFolder.folders) {
// 			output.push(this.easyStat(folder.name, true, 0, null));
// 		}

// 		for (const file of foundFolder.files) {
// 			output.push(
// 				this.easyStat(
// 					file.name,
// 					false,
// 					file.metadata.size,
// 					file.metadata.updated,
// 				),
// 			);
// 		}

// 		return output;
// 	}

// 	async chdir(pathStr = ".") {
// 		console.log("chdir", pathStr);

// 		pathStr = this.pathStrAsRoot(pathStr);

// 		const foundFolder = this.rootFolder.traverseForFolder(pathStr);
// 		if (foundFolder == null) return null;

// 		this.currentFolder = foundFolder;
// 		return this.currentDirectory();
// 	}

// 	async mkdir(pathStr = ".") {
// 		console.log("mkdir", pathStr);

// 		pathStr = this.pathStrAsRoot(pathStr);

// 		await this.filesService.createFolder(this.user, pathStr);
// 		await this.refreshFiles();

// 		return pathStr;
// 	}

// 	// async write(fileName: string) {
// 	// 	const pathStr = this.pathStrAsRoot(fileName);

// 	// 	const stream = new Readable()

// 	//const chunks: Buffer[] = [];
// 	// const stream = new Writable({
// 	// 	write: (chunk: Buffer, encoding, next) => {
// 	// 		chunks.push(chunk);
// 	// 		next();
// 	// 	},
// 	// 	final: next => {
// 	// 		this.filesService
// 	// 			.uploadFile(this.user, pathStr, {
// 	// 				buffer: Buffer.concat(chunks),
// 	// 				mimetype:
// 	// 					mime.lookup(fileName) || "application/octet-stream",
// 	// 				originalname: fileName,
// 	// 				fieldname: null,
// 	// 				encoding: null,
// 	// 			})
// 	// 			.then(() => next())
// 	// 			.catch(err => {
// 	// 				next(err);
// 	// 			});
// 	// 	},
// 	// });

// 	// 	const stream = new Readable();

// 	// 	this.filesService.uploadFile(this.user, pathStr, {
// 	// 		stream,
// 	// 		mimetype: mime.lookup(fileName) || "application/octet-stream",
// 	// 		originalname: fileName,
// 	// 		fieldname: null,
// 	// 		encoding: null,
// 	// 	});

// 	// 	return { stream };
// 	// }

// 	async read(fileName: string, { start } = { start: 0 }) {
// 		console.log("read", fileName);

// 		const pathStr = this.pathStrAsRoot(fileName);

// 		const file = this.rootFolder.traverseForFile<{ url: string }>(pathStr);

// 		// const stream = fs.createReadStream("/home/maki/Pictures/foxii.png");
// 		// return { stream };

// 		const res = await fetch(file.metadata.url);
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
// 		this.server = new FtpSrv({
// 			url: "ftps://0.0.0.0:21",
// 			greeting: "Welcome to Tivoli Cloud user files!",
// 		});

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
// 					.then(async user => {
// 						if (user == null) reject();

// 						const fs = new UserFileSystem(
// 							connection,
// 							user,
// 							this.filesService,
// 						);
// 						await fs.refreshFiles();

// 						resolve({ fs });
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
