import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { formatExt } from "src/app/utils";

export class File {
	public type: string;
	public icon: string;

	constructor(
		public key: string,
		public name: string,
		public size: number,
		public url: string,
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
	constructor(private readonly http: HttpClient) {}

	private findFolderByName(name: string, rootFolder: Folder) {
		for (const folder of rootFolder.folders) {
			if (folder.name == name) return folder;
		}
		return null;
	}

	private getFolder(path: string[], startingFolder: Folder) {
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
				const folder = new Folder(folderName, currentFolder);
				currentFolder.folders.push(folder);
				currentFolder = folder;
			}
		}

		return currentFolder;
	}

	private fakeGetFiles() {
		const randomStringChars = "abcdefghijklmnopqrstuvwxyz";
		const randomString = (length: number) =>
			new Array(length)
				.fill(null)
				.map(
					() =>
						randomStringChars[
							Math.floor(Math.random() * randomStringChars.length)
						],
				)
				.join("");

		const randomExts = ["png", "ts", "jpg", "js"];
		const randomExt = () =>
			randomExts[Math.floor(Math.random() * randomExts.length)];

		const randomKey = () =>
			"/" +
			new Array(Math.floor(Math.random() * 6) + 1)
				.fill(null)
				.map(() => randomString(Math.floor(Math.random() * 6) + 6))
				.join("/") +
			"." +
			randomExt();

		const files = new Array(50).fill(null).map(() => {
			return {
				key: randomKey(),
				lastModified: new Date().toISOString(),
				size: Math.random() * 1000000,
				url: "https://caitlyn.is.cute",
			};
		});

		return files;
	}

	getFiles() {
		return this.http
			.get<
				{
					key: string;
					lastModified: Date;
					size: number;
					url: string;
				}[]
			>("/api/user/files")
			.pipe(
				//map(() => this.fakeGetFiles()),
				map(files => {
					const rootFolder = new Folder("");

					for (const keyedFile of files) {
						const path = keyedFile.key.slice(1).split("/");

						const fileName = path.pop();
						const folder = this.getFolder(path, rootFolder);

						// add file to folder

						const file = new File(
							keyedFile.key,
							fileName,
							keyedFile.size,
							keyedFile.url,
						);
						const ext = formatExt(file.name);
						file.type = ext.type;
						file.icon = ext.icon;

						console.log(file);

						folder.files.push(file);
					}

					return {
						folder: rootFolder,
						total: files.length,
					};
				}),
			);
	}

	getStatus() {
		return this.http.get<Status>("/api/user/files/status");
	}
}
