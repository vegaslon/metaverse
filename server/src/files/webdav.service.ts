import { Injectable, OnModuleInit } from "@nestjs/common";
import { v2 as WebDav } from "webdav-server";
import { AuthService } from "../auth/auth.service";
import { FilesService } from "./files.service";
import { AuthTokenGrantType, AuthTokenScope } from "../auth/auth.dto";
import { User } from "../user/user.schema";
import { KeyedFileSystem, Folder } from "../common/keyed-file-system";
import { md5 } from "webdav-server/lib/user/CommonFunctions";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { JwtPayloadType, JwtPayload } from "../auth/jwt.strategy";

// class FileSystem extends WebDav.FileSystem {
// 	private fs = new KeyedFileSystem();

// 	private rootFolder: Folder;
// 	//private currentFolder: Folder;

// 	private user: User;

// 	async refreshFiles() {
// 		const files = await this.filesService.getFiles(this.user, "/");

// 		this.rootFolder = this.fs.init(files);

// 		// this.currentFolder =
// 		// 	this.currentFolder == null
// 		// 		? this.rootFolder
// 		// 		: this.rootFolder.traverseForFolder(
// 		// 				this.currentFolder.absolutePath(),
// 		// 		  ) || this.rootFolder;
// 	}

// 	private async verifyUser(
// 		ctx: WebDav.IContextInfo,
// 		callback: WebDav.ReturnCallback<any>,
// 	) {
// 		const user: User = (ctx.context.user as any).user;

// 		if (user == null) {
// 			callback(new Error("User not logged in"));
// 			return true;
// 		} else {
// 			if (this.user == null) {
// 				this.user = user;
// 				await this.refreshFiles();
// 			}

// 			return false;
// 		}
// 	}

// 	private getFile(path: WebDav.Path) {
// 		return this.rootFolder.traverseForFile(
// 			KeyedFileSystem.pathArrToStr(path.paths),
// 		);
// 	}

// 	private getFolder(path: WebDav.Path) {
// 		return this.rootFolder.traverseForFolder(
// 			KeyedFileSystem.pathArrToStr(path.paths),
// 		);
// 	}

// 	constructor(private readonly filesService: FilesService) {
// 		super(null);
// 		this.doNotSerialize();
// 	}

// 	async _lockManager(
// 		path: WebDav.Path,
// 		ctx: WebDav.LockManagerInfo,
// 		callback: WebDav.ReturnCallback<WebDav.ILockManager>,
// 	) {
// 		if (await this.verifyUser(ctx, callback)) return;
// 		console.log("_lockManager");
// 	}

// 	private readonly __propertyManager = {
// 		setProperty(
// 			name: string,
// 			value: WebDav.ResourcePropertyValue,
// 			attributes: WebDav.PropertyAttributes,
// 			callback: WebDav.SimpleCallback,
// 		) {
// 			callback(null);
// 		},
// 		getProperty(
// 			name: string,
// 			callback: WebDav.Return2Callback<
// 				WebDav.ResourcePropertyValue,
// 				WebDav.PropertyAttributes
// 			>,
// 		) {
// 			callback(null, "", {});
// 		},
// 		removeProperty(name: string, callback: WebDav.SimpleCallback) {
// 			callback(null);
// 		},
// 		getProperties(callback) {
// 			callback(null, {});
// 		},
// 	};

// 	async _propertyManager(
// 		path: WebDav.Path,
// 		ctx: WebDav.PropertyManagerInfo,
// 		callback: WebDav.ReturnCallback<WebDav.IPropertyManager>,
// 	) {
// 		if (await this.verifyUser(ctx, callback)) return;
// 		console.log("_propertyManager", path);

// 		callback(null, this.__propertyManager);
// 	}

// 	async _readDir(
// 		path: WebDav.Path,
// 		ctx: WebDav.ReadDirInfo,
// 		callback: WebDav.ReturnCallback<string[] | WebDav.Path[]>,
// 	) {
// 		if (await this.verifyUser(ctx, callback)) return;
// 		console.log("_readDir", path);

// 		const found = this.getFolder(path);
// 		const output: string[] = [];

// 		for (const folder of found.folders) {
// 			output.push(folder.name);
// 		}
// 		for (const file of found.files) {
// 			output.push(file.name);
// 		}

// 		callback(null, output);
// 	}

// 	async _type(
// 		path: WebDav.Path,
// 		ctx: WebDav.TypeInfo,
// 		callback: WebDav.ReturnCallback<WebDav.ResourceType>,
// 	) {
// 		if (await this.verifyUser(ctx, callback)) return;
// 		console.log("_type", path);

// 		const folder = this.getFolder(path);
// 		callback(null, new WebDav.ResourceType(folder == null, folder != null));
// 	}
// }

// based on WebDav.HTTPDigestAuthentication
// https://github.com/OpenMarshal/npm-WebDAV-Server/blob/master/src/user/v2/authentication/HTTPDigestAuthentication.ts
// class TivoliAuthentication implements WebDav.HTTPAuthentication {
// 	private readonly realm = "Tivoli Cloud VR";
// 	private readonly nonceSize = 50;

// 	constructor(private readonly authService: AuthService) {}

// 	generateNonce(): string {
// 		const buffer = Buffer.alloc(this.nonceSize);
// 		for (let i = 0; i < buffer.length; ++i)
// 			buffer[i] = Math.floor(Math.random() * 256);

// 		return md5(buffer);
// 	}

// 	askForAuthentication(ctx: WebDav.HTTPRequestContext) {
// 		return {
// 			"WWW-Authenticate": `Digest realm="${
// 				this.realm
// 			}", qop="auth", nonce="${this.generateNonce()}", opaque="${this.generateNonce()}"`,
// 		};
// 	}

// 	getUser(
// 		ctx: WebDav.HTTPRequestContext,
// 		callback: (error: Error, user: WebDav.IUser) => void,
// 	) {
// 		const o
// 	}
// }

class TivoliUserManager implements WebDav.ITestableUserManager {
	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
	) {}

	getDefaultUser(callback: (user: WebDav.IUser) => void) {
		console.log("getDefaultUser");
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
		console.log("getUserByNamePassword");

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

@Injectable()
export class WebDavService implements OnModuleInit {
	private readonly port = 4000;
	private server: WebDav.WebDAVServer;

	constructor(
		//private readonly authService: AuthService,
		private readonly filesService: FilesService,
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
	) {}

	onModuleInit() {
		//const userManager = new WebDav.SimpleUserManager();
		//const user = userManager.addUser("username", "password", false);

		// Privilege manager (tells which users can access which files/folders)
		//const privilegeManager = new WebDav.SimplePathPrivilegeManager();
		//privilegeManager.setRights(user, "/", ["all"]);

		this.server = new WebDav.WebDAVServer({
			port: this.port,

			httpAuthentication: new WebDav.HTTPBasicAuthentication(
				new TivoliUserManager(this.userService, this.jwtService),
				"Tivoli Cloud VR",
			),
			privilegeManager: new TivoliPrivilegeManager(),
			requireAuthentification: true,

			//rootFileSystem: new FileSystem(this.filesService),
			rootFileSystem: new WebDav.PhysicalFileSystem("/root"),
		});

		this.server.start(() =>
			console.log("WebDav server running on *:" + this.port),
		);
	}
}
