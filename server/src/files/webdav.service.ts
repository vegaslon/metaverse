import { Injectable, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import fetch from "node-fetch";
import { Readable } from "stream";
import { v2 as WebDav } from "webdav-server";
import { JwtPayload, JwtPayloadType } from "../auth/jwt.strategy";
import { Folder, KeyedFileSystem } from "../common/keyed-file-system";
import { User } from "../user/user.schema";
import { UserService } from "../user/user.service";
import { FilesService, UserFile } from "./files.service";
import { UserFilesCache } from "./user-files-cache.schema";

class TivoliUserManager implements WebDav.ITestableUserManager {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
	) {}

	getDefaultUser(callback: (user: WebDav.IUser) => void) {
		callback({
			uid: "DefaultUser",
			isAdministrator: false,
			isDefaultUser: true,
			username: "DefaultUser",
			password: null,
		});
	}

	private async tokenToUser(token: string): Promise<User> {
		// jwt.strategy.ts
		const payload = this.jwtService.decode(token) as JwtPayload;

		if (
			payload.t != JwtPayloadType.USER ||
			payload.id == null ||
			payload.exp == null
		)
			throw new Error("Invalid token");

		const now = +new Date() / 1000;
		if (now > payload.exp) throw new Error("Expired token");

		const user = await this.userService.findById(payload.id);
		if (user == null) throw new Error("Invalid token");

		// auth.guard.ts
		if (user.emailVerified == false) throw new Error("Unverified email");

		return user;
	}

	getUserByNamePassword(
		username: string,
		password: string,
		callback: (error: Error, user?: WebDav.IUser) => void,
	) {
		this.tokenToUser(password)
			.then(user => {
				callback(null, {
					uid: user.id,
					isAdministrator: false,
					isDefaultUser: false,
					username: user.username,
					password: null,
					user,
				} as WebDav.IUser);
			})
			.catch(error => {
				callback(error);
			});
	}
}

class TivoliPrivilegeManager extends WebDav.PrivilegeManager {
	constructor() {
		super();
	}

	_can(
		fullPath: WebDav.Path,
		user: WebDav.IUser,
		resource: WebDav.Resource,
		privilege: string,
		callback: WebDav.PrivilegeManagerCallback,
	) {
		callback(
			null,
			user.isDefaultUser == false && (user as any).user != null,
		);
	}
}

class TivoliFileSystem extends WebDav.FileSystem {
	private asyncify<T = any>(
		ctx: WebDav.IContextInfo,
		callback: WebDav.ReturnCallback<T>,
		func: (user: User) => Promise<T>,
	) {
		const user = (ctx.context.user as any).user as User;
		if (user == null) return callback(new Error("User not logged in"));

		func(user)
			.then(data => {
				callback(null, data);
			})
			.catch(error => {
				callback(error);
			});
	}

	private async getRootFolder(user: User, clearCache = false) {
		let files: UserFile[];

		const cache = clearCache
			? null
			: await this.userFilesCacheModel.findById(user.id);

		if (clearCache)
			await this.userFilesCacheModel.deleteOne({ _id: user._id });

		if (cache != null) {
			files = cache.files;
		} else {
			files = await this.filesService.getFiles(user, "/");

			const cache = new this.userFilesCacheModel({
				_id: user._id,
				files,
				expireAt: Date.now() + 1000 * 60,
			});
			await cache.save();
		}

		const fs = new KeyedFileSystem();
		return fs.init(files);
	}

	private getFile(rootFolder: Folder, path: WebDav.Path) {
		return rootFolder.traverseForFile(
			KeyedFileSystem.pathArrToStr(path.paths),
		);
	}

	private getFolder(rootFolder: Folder, path: WebDav.Path) {
		return rootFolder.traverseForFolder(
			KeyedFileSystem.pathArrToStr(path.paths),
		);
	}

	constructor(
		private readonly filesService: FilesService,
		private readonly userFilesCacheModel: Model<UserFilesCache>,
	) {
		super(null);
		this.doNotSerialize();
	}

	// https://github.com/OpenMarshal/npm-WebDAV-Server/wiki/Custom-File-System-%5Bv2%5D

	// slows things down and is unneccesary
	// _fastExistCheck(
	// 	context: WebDav.RequestContext,
	// 	path: WebDav.Path,
	// 	callback: (exists: boolean) => void,
	// ) {
	// 	this.asyncify<boolean>(
	// 		{ context },
	// 		(error, data) => callback(error ? false : data),
	// 		async user => {
	// 			const rootFolder = await this.getRootFolder(user);

	// 			return (
	// 				this.getFolder(rootFolder, path) != null ||
	// 				this.getFile(rootFolder, path) != null
	// 			);
	// 		},
	// 	);
	// }

	_create(
		path: WebDav.Path,
		ctx: WebDav.CreateInfo,
		callback: WebDav.SimpleCallback,
	) {
		this.asyncify<any>(
			ctx,
			(error, data) => callback(error),
			async user => {
				// console.log("_create", path);

				if (ctx.type.isDirectory)
					await this.filesService.createFolder(
						user,
						KeyedFileSystem.pathArrToStr(path.paths),
					);
			},
		);
	}

	_delete(
		path: WebDav.Path,
		ctx: WebDav.DeleteInfo,
		callback: WebDav.SimpleCallback,
	) {
		this.asyncify<any>(
			ctx,
			(error, data) => callback(error),
			async user => {
				// console.log("_delete", path);

				const rootFolder = await this.getRootFolder(user);
				const pathStr = KeyedFileSystem.pathArrToStr(path.paths);

				if (rootFolder.traverseForFile(pathStr) != null)
					return await this.filesService.deleteFile(user, pathStr);

				if (rootFolder.traverseForFolder(pathStr) != null)
					return await this.filesService.deleteFolder(user, pathStr);
			},
		);
	}

	_openReadStream(
		path: WebDav.Path,
		ctx: WebDav.OpenReadStreamInfo,
		callback: WebDav.ReturnCallback<Readable>,
	) {
		this.asyncify<any>(ctx, callback, async user => {
			// console.log("_openReadStream", path);

			const rootFolder = await this.getRootFolder(user);
			const pathStr = KeyedFileSystem.pathArrToStr(path.paths);

			const file = rootFolder.traverseForFile(pathStr);
			if (file == null) throw new Error("File not found");

			const res = await fetch(file.metadata.url);
			return res.body;

			// const stream = new Readable();
			// const mimetype =
			// 	mime.lookup(path.paths.pop()) || "application/octet-stream";

			// this.filesService.uploadFile(user, pathStr, {
			// 	stream,
			// 	mimetype,

			// 	encoding: "",
			// 	fieldname: "",
			// 	originalname: "",
			// });

			// return stream;
		});
	}

	_size(
		path: WebDav.Path,
		ctx: WebDav.SizeInfo,
		callback: WebDav.ReturnCallback<number>,
	) {
		this.asyncify<any>(ctx, callback, async user => {
			// console.log("_size", path);

			const rootFolder = await this.getRootFolder(user);
			const pathStr = KeyedFileSystem.pathArrToStr(path.paths);

			const file = rootFolder.traverseForFile(pathStr);
			if (file != null) return file.metadata.size;

			return 0;
		});
	}

	_lockManager(
		path: WebDav.Path,
		ctx: WebDav.LockManagerInfo,
		callback: WebDav.ReturnCallback<WebDav.ILockManager>,
	) {
		this.asyncify<WebDav.ILockManager>(ctx, callback, async user => {
			// console.log("_lockManager");

			return {
				getLocks(callback: WebDav.ReturnCallback<WebDav.Lock[]>) {
					callback(null, []);
				},
				setLock(lock: WebDav.Lock, callback: WebDav.SimpleCallback) {
					callback(null);
				},
				removeLock(
					uuid: string,
					callback: WebDav.ReturnCallback<boolean>,
				) {
					callback(null, true);
				},
				getLock(
					uuid: string,
					callback: WebDav.ReturnCallback<WebDav.Lock>,
				) {
					callback(null, null);
				},
				refresh(
					uuid: string,
					timeoutSeconds: number,
					callback: WebDav.ReturnCallback<WebDav.Lock>,
				) {
					callback(null, null);
				},
			};
		});
	}

	_propertyManager(
		path: WebDav.Path,
		ctx: WebDav.PropertyManagerInfo,
		callback: WebDav.ReturnCallback<WebDav.IPropertyManager>,
	) {
		this.asyncify<WebDav.IPropertyManager>(ctx, callback, async user => {
			return {
				setProperty(
					name: string,
					value: WebDav.ResourcePropertyValue,
					attributes: WebDav.PropertyAttributes,
					callback: WebDav.SimpleCallback,
				) {
					// console.log("_propertyManager setProperty", path);
					callback(null);
				},
				getProperty(
					name: string,
					callback: WebDav.Return2Callback<
						WebDav.ResourcePropertyValue,
						WebDav.PropertyAttributes
					>,
				) {
					// console.log("_propertyManager getProperty", path);
					callback(null, "", {});
				},
				removeProperty(name: string, callback: WebDav.SimpleCallback) {
					// console.log("_propertyManager removeProperty", path);
					callback(null);
				},
				getProperties(
					callback: WebDav.ReturnCallback<WebDav.PropertyBag>,
				) {
					// console.log("_propertyManager getProperties", path);
					callback(null, {});
				},
			};
		});
	}

	_readDir(
		path: WebDav.Path,
		ctx: WebDav.ReadDirInfo,
		callback: WebDav.ReturnCallback<string[] | WebDav.Path[]>,
	) {
		this.asyncify<string[]>(ctx, callback, async user => {
			// console.log("_readDir", path);

			const rootFolder = await this.getRootFolder(user, true);

			const foundFolder = this.getFolder(rootFolder, path);
			if (foundFolder == null) throw new Error("Directory not found");

			const output: string[] = [];

			for (const folder of foundFolder.folders) {
				output.push(folder.name + "/");
			}
			for (const file of foundFolder.files) {
				output.push(file.name);
			}

			return output;
		});
	}

	_type(
		path: WebDav.Path,
		ctx: WebDav.TypeInfo,
		callback: WebDav.ReturnCallback<WebDav.ResourceType>,
	) {
		this.asyncify<WebDav.ResourceType>(ctx, callback, async user => {
			const rootFolder = await this.getRootFolder(user);

			const folder = this.getFolder(rootFolder, path);

			return new WebDav.ResourceType(folder == null, folder != null);
		});
	}
}

@Injectable()
export class WebDavService implements OnModuleInit {
	private readonly port = 4000;
	private server: WebDav.WebDAVServer;

	constructor(
		private readonly filesService: FilesService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		@InjectModel("users.files.cache")
		private readonly userFilesCacheModel: Model<UserFilesCache>,
	) {}

	onModuleInit() {
		//const rootFileSystem = new WebDav.PhysicalFileSystem("/home/maki");

		this.server = new WebDav.WebDAVServer({
			port: this.port,

			httpAuthentication: new WebDav.HTTPBasicAuthentication(
				new TivoliUserManager(this.userService, this.jwtService),
				"Tivoli Cloud VR",
			),
			privilegeManager: new TivoliPrivilegeManager(),
			requireAuthentification: true,

			rootFileSystem: new TivoliFileSystem(
				this.filesService,
				this.userFilesCacheModel,
			),
			//rootFileSystem,
		});

		this.server.start(() => {
			// console.log("WebDav server running on *:" + this.port),
		});
	}
}
