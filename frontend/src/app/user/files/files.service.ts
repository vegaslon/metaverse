import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, catchError } from "rxjs/operators";
import { UtilsService } from "../../utils.service";
import { Upload } from "./upload/upload.component";
import { throwError } from "rxjs";
import { AuthService } from "../../auth/auth.service";

export class File {
	public type: string;
	public icon: string;

	constructor(
		public key: string,
		public name: string,
		public size: number,
		public httpUrl: string,
		public teaUrl: string,
		public parent: Folder = null,
	) {}
}

export class Folder {
	constructor(
		public name: string,
		public parent: Folder = null,
		public folders: Folder[] = [],
		public files: File[] = [],
	) {}
}

export class Status {
	usedSize: number;
	maxSize: number;
}

@Injectable({
	providedIn: "root",
})
export class FilesService {
	constructor(
		private readonly authService: AuthService,
		private readonly utilsService: UtilsService,
		private readonly http: HttpClient,
	) {}

	private findFolderByName(name: string, currentFolder: Folder) {
		for (const folder of currentFolder.folders) {
			if (folder.name == name) return folder;
		}
		return null;
	}

	getFolder(path: string[], startingFolder: Folder, createNew = true) {
		let currentFolder = startingFolder;
		if (path.length == 0) return currentFolder;

		for (const folderName of path) {
			const foundFolder = this.findFolderByName(
				folderName,
				currentFolder,
			);

			if (foundFolder != null) {
				// folder exists
				currentFolder = foundFolder;
			} else {
				// create folder
				if (createNew) {
					const folder = new Folder(folderName, currentFolder);
					currentFolder.folders.push(folder);
					currentFolder = folder;
				} else {
					return null;
				}
			}
		}

		return currentFolder;
	}

	// private fakeGetFiles() {
	// 	const randomStringChars = "abcdefghijklmnopqrstuvwxyz";
	// 	const randomString = (length: number) =>
	// 		new Array(length)
	// 			.fill(null)
	// 			.map(
	// 				() =>
	// 					randomStringChars[
	// 						Math.floor(Math.random() * randomStringChars.length)
	// 					],
	// 			)
	// 			.join("");

	// 	const randomExts = ["png", "ts", "jpg", "js"];
	// 	const randomExt = () =>
	// 		randomExts[Math.floor(Math.random() * randomExts.length)];

	// 	const randomKey = () =>
	// 		"/" +
	// 		new Array(Math.floor(Math.random() * 6) + 1)
	// 			.fill(null)
	// 			.map(() => randomString(Math.floor(Math.random() * 6) + 6))
	// 			.join("/") +
	// 		"." +
	// 		randomExt();

	// 	const files = new Array(50).fill(null).map(() => {
	// 		return {
	// 			key: randomKey(),
	// 			lastModified: new Date().toISOString(),
	// 			size: Math.random() * 1000000,
	// 			url: "https://caitlyn.is.cute",
	// 		};
	// 	});

	// 	return files;
	// }

	getFiles() {
		return this.http
			.get<{
				url: string;
				files: {
					key: string;
					lastModified: Date;
					size: number;
				}[];
			}>("/api/user/files")
			.pipe(
				//map(() => this.fakeGetFiles()),
				map(data => {
					const files = data.files;

					const username = this.authService.user$
						.getValue()
						.profile.username.toLowerCase();

					const httpUrlBase = data.url + "/" + username;
					const teaUrlBase = "tea://" + username;

					const rootFolder = new Folder("");
					let totalFiles = 0;

					for (const keyedFile of files) {
						const path = keyedFile.key.slice(1).split("/");

						const fileName = path.pop();
						const folder = this.getFolder(path, rootFolder);

						// add file to folder

						if (fileName.length != 0) {
							const file = new File(
								keyedFile.key,
								fileName,
								keyedFile.size,
								httpUrlBase + keyedFile.key,
								teaUrlBase + keyedFile.key,
								folder,
							);
							const ext = this.utilsService.formatExt(file.name);
							file.type = ext.type;
							file.icon = ext.icon;

							folder.files.push(file);
							totalFiles++;
						}
					}

					return {
						folder: rootFolder,
						total: totalFiles,
					};
				}),
			);
	}

	getStatus() {
		return this.http.get<Status>("/api/user/files/status");
	}

	uploadFile(path: string, file: any, upload?: Upload) {
		const formData = new FormData();
		formData.set("path", path);
		formData.set("file", file);

		return this.http
			.put<{ url: string; size: number }>("/api/user/files", formData, {
				reportProgress: true,
				observe: "events",
			} as any)
			.pipe(
				catchError((error: HttpErrorResponse) => {
					return throwError(error.error.message);
				}),
				map(data => ({
					...data,
					upload,
				})),
			);
	}

	deleteFile(path: string) {
		return this.http.delete("/api/user/files", {
			params: {
				path,
			},
		});
	}

	createFolder(path: string) {
		return this.http.put(
			"/api/user/files/folder",
			{},
			{
				params: {
					path,
				},
			},
		);
	}

	deleteFolder(path: string) {
		return this.http.delete("/api/user/files/folder", {
			params: {
				path,
			},
		});
	}

	moveFile(oldPath: string, newPath: string) {
		return this.http.post(
			"/api/user/files/move",
			{},
			{
				params: {
					oldPath,
					newPath,
				},
			},
		);
	}

	moveFolder(oldPath: string, newPath: string) {
		return this.http.post(
			"/api/user/files/folder/move",
			{},
			{
				params: {
					oldPath,
					newPath,
				},
			},
		);
	}
}
