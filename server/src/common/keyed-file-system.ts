// import { exampleKeyedFiles } from "./keyed-examples";

export class File<M> {
	public readonly name: string;

	constructor(
		public readonly key: string,
		public readonly parent: Folder,
		public readonly metadata: M = null,
	) {
		this.name = this.key.split("/").pop();
	}
}

export class Folder {
	constructor(
		public readonly name: string,
		public readonly parent: Folder,
		public readonly folders: Folder[],
		public readonly files: File<any>[],
	) {}

	absolutePath() {
		let currentFolder: Folder = this;

		const currentPath: string[] = [];

		while (currentFolder.parent != null) {
			currentPath.unshift(currentFolder.name);
			currentFolder = currentFolder.parent;
		}

		return (
			"/" + currentPath.join("/") + (currentPath.length == 0 ? "" : "/")
		);
	}

	findFolder(name: string) {
		for (const folder of this.folders) {
			if (folder.name == name) return folder;
		}
		return null;
	}

	findFile<FileMetadata = any>(name: string) {
		for (const file of this.files) {
			if (file.name == name) return file as File<FileMetadata>;
		}
		return null;
	}

	private traverse(pathStr: string, forFolder: boolean) {
		let currentFolder: Folder = this;

		const currentPath = KeyedFileSystem.pathStrToArr(pathStr);
		if (currentPath.length == 0) return currentFolder;

		while (currentPath.length != 1) {
			const name = currentPath[0];

			// continue if empty
			if (name == "") {
				currentPath.shift();
				continue;
			}

			currentFolder = currentFolder.findFolder(name);
			if (currentFolder == null) return null;
		}

		// last in path
		const name = currentPath[0];

		return forFolder
			? currentFolder.findFolder(name)
			: currentFolder.findFile(name);
	}

	traverseForFolder(pathStr: string) {
		return this.traverse(pathStr, true) as Folder;
	}

	traverseForFile<FileMetadata = any>(pathStr: string) {
		return this.traverse(pathStr, false) as File<FileMetadata>;
	}
}

export class KeyedFileSystem {
	root = new Folder(null, null, [], []);

	constructor() {}

	static pathStrToArr(pathStr: string) {
		return pathStr.split("/").filter(name => name != "");
	}

	static pathArrToStr(pathArr: string[]) {
		return "/" + pathArr.join("/") + (pathArr.length == 0 ? "" : "/");
	}

	static pathStrIsFolder(pathStr: string) {
		const pathArr = this.pathStrToArr(pathStr);
		return pathStr.endsWith("/") || !pathArr.pop().includes(".");
	}

	static pathArrIsFolder(pathArr: string[]) {
		return pathArr.length == 0 || !pathArr.pop().includes(".");
	}

	init(keyedFiles: ({ key: string } & { [s: string]: any })[]) {
		this.root = new Folder(null, null, [], []);

		for (const keyedFile of keyedFiles) {
			const path = keyedFile.key.split("/").filter(name => name != "");

			let currentFolder = this.root;

			for (let i = 0; i < path.length; i++) {
				const name = path[i];

				const isFolder =
					i != path.length - 1
						? true
						: keyedFile.key.endsWith("/") || !name.includes(".");

				if (isFolder) {
					let foundFolder = currentFolder.findFolder(name);

					if (foundFolder == null) {
						// create new folder
						foundFolder = new Folder(name, currentFolder, [], []);
						currentFolder.folders.push(foundFolder);
					}

					currentFolder = foundFolder;
				} else {
					const file = new File(
						keyedFile.key,
						currentFolder,
						keyedFile as any, // metadata
					);

					currentFolder.files.push(file);
				}
			}
		}

		return this.root;
	}
}

// (async () => {
// 	const fs = new KeyedFileSystem();
// 	fs.init([...exampleKeyedFiles, { key: "/yay.asd/" }]);

// 	console.log("test: abs", fs.root.absolutePath());
// 	//console.log("test: folder", fs.root.traverseForFolder("/"));
// 	console.log(
// 		"test: abs folder",
// 		fs.root.traverseForFolder("/yay.asd/").absolutePath(),
// 	);
// })();
