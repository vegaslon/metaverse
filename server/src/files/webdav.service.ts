import { Injectable, OnModuleInit } from "@nestjs/common";
import { v2 as WebDav } from "webdav-server";
import { AuthService } from "../auth/auth.service";
import { FilesService } from "./files.service";
import { AuthTokenGrantType, AuthTokenScope } from "../auth/auth.dto";
import { User } from "../user/user.schema";
import { KeyedFileSystem, Folder } from "../common/keyed-file-system";

class UserManager implements WebDav.ITestableUserManager {
	constructor(private readonly authService: AuthService) {}

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

	getUserByNamePassword(
		username: string,
		password: string,
		callback: (error: Error, user?: WebDav.IUser) => void,
	) {
		console.log("getUserByNamePassword");
		this.authService
			.validateUser({
				username,
				password,
				grant_type: AuthTokenGrantType.password,
				scope: AuthTokenScope.owner,
			})
			.then(user => {
				callback(null, {
					uid: user.id,
					isAdministrator: false,
					isDefaultUser: false,
					username: user.username,
					password: null,
					user,
				} as any);
			})
			.catch(error => {
				callback(error);
			});
	}
}

class PrivilegeManager extends WebDav.PrivilegeManager {
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
		//console.log("_can", user);
		callback(null, user != null);
	}
}

class FileSystem extends WebDav.FileSystem {
	private fs = new KeyedFileSystem();

	private rootFolder: Folder;
	//private currentFolder: Folder;

	private user: User;

	async refreshFiles() {
		const files = await this.filesService.getFiles(this.user, "/");

		this.rootFolder = this.fs.init(files);

		// this.currentFolder =
		// 	this.currentFolder == null
		// 		? this.rootFolder
		// 		: this.rootFolder.traverseForFolder(
		// 				this.currentFolder.absolutePath(),
		// 		  ) || this.rootFolder;
	}

	private async verifyUser(
		ctx: WebDav.IContextInfo,
		callback: WebDav.ReturnCallback<any>,
	) {
		const user: User = (ctx.context.user as any).user;

		if (user == null) {
			callback(new Error("User not logged in"));
			return true;
		} else {
			if (this.user == null) {
				this.user = user;
				await this.refreshFiles();
			}

			return false;
		}
	}

	private getFile(path: WebDav.Path) {
		return this.rootFolder.traverseForFile(
			KeyedFileSystem.pathArrToStr(path.paths),
		);
	}

	private getFolder(path: WebDav.Path) {
		return this.rootFolder.traverseForFolder(
			KeyedFileSystem.pathArrToStr(path.paths),
		);
	}

	constructor(private readonly filesService: FilesService) {
		super(null);
		this.doNotSerialize();
	}

	async _lockManager(
		path: WebDav.Path,
		ctx: WebDav.LockManagerInfo,
		callback: WebDav.ReturnCallback<WebDav.ILockManager>,
	) {
		if (await this.verifyUser(ctx, callback)) return;
		console.log("_lockManager");
	}

	private readonly __propertyManager = {
		setProperty(
			name: string,
			value: WebDav.ResourcePropertyValue,
			attributes: WebDav.PropertyAttributes,
			callback: WebDav.SimpleCallback,
		) {
			callback(null);
		},
		getProperty(
			name: string,
			callback: WebDav.Return2Callback<
				WebDav.ResourcePropertyValue,
				WebDav.PropertyAttributes
			>,
		) {
			callback(null, "", {});
		},
		removeProperty(name: string, callback: WebDav.SimpleCallback) {
			callback(null);
		},
		getProperties(callback) {
			callback(null, {});
		},
	};

	async _propertyManager(
		path: WebDav.Path,
		ctx: WebDav.PropertyManagerInfo,
		callback: WebDav.ReturnCallback<WebDav.IPropertyManager>,
	) {
		if (await this.verifyUser(ctx, callback)) return;
		console.log("_propertyManager", path);

		callback(null, this.__propertyManager);
	}

	async _readDir(
		path: WebDav.Path,
		ctx: WebDav.ReadDirInfo,
		callback: WebDav.ReturnCallback<string[] | WebDav.Path[]>,
	) {
		if (await this.verifyUser(ctx, callback)) return;
		console.log("_readDir", path);

		const found = this.getFolder(path);
		const output: string[] = [];

		for (const folder of found.folders) {
			output.push(folder.name);
		}
		for (const file of found.files) {
			output.push(file.name);
		}

		callback(null, output);
	}

	async _type(
		path: WebDav.Path,
		ctx: WebDav.TypeInfo,
		callback: WebDav.ReturnCallback<WebDav.ResourceType>,
	) {
		if (await this.verifyUser(ctx, callback)) return;
		console.log("_type", path);

		const folder = this.getFolder(path);
		callback(null, new WebDav.ResourceType(folder == null, folder != null));
	}
}

@Injectable()
export class WebDavService implements OnModuleInit {
	private readonly port = 4000;
	private server: WebDav.WebDAVServer;

	constructor(
		private readonly authService: AuthService,
		private readonly filesService: FilesService,
	) {}

	onModuleInit() {
		this.server = new WebDav.WebDAVServer({
			port: this.port,

			//privilegeManager: new PrivilegeManager(),
			httpAuthentication: new WebDav.HTTPBasicAuthentication(
				new UserManager(this.authService),
				"Tivoli Cloud VR",
			),
			requireAuthentification: true,

			rootFileSystem: new FileSystem(this.filesService),
			//rootFileSystem: new WebDav.PhysicalFileSystem("/home/maki"),
		});

		this.server.start(() => console.log("WebDav server running on *:4000"));
	}
}
