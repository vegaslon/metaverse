import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class UtilsService {
	fileTypes = {
		image: [
			// https://en.wikipedia.org/wiki/Image_file_formats
			"jpeg",
			"jpg",
			"jfif",
			"exif",
			"tiff",
			"tif",

			"gif",
			"bmp",
			"png",
			"apng",

			"ppm",
			"pgm",
			"pbm",
			"pnm",

			"webp",
			"hdr",
			"heif",

			"flif",
			"ico",
			"tga",

			"afphoto",
			"kra",
			"psd",
			"sai",
			"xcf",

			"svg",
			"afdesign",
			"ai",

			"dds",
			"ktx",
		],
		code: [
			// https://en.wikipedia.org/wiki/List_of_file_formats#Programming_languages_and_scripts
			"bat",
			"cmd",
			"coffee",
			"c",
			"cpp",
			"h",
			"hpp",
			"js",
			"jsx",
			"lua",
			"php",
			"pl",
			"ps1",
			"py",
			"rb",
			"rs",
			"sh",
			"ts",
			"tsx",

			"json",
			"xml",
			"yaml",
			"yml",

			"glsl",
			"fs",
			"vs",

			"html",
			"css",
		],
		video: [
			// https://en.wikipedia.org/wiki/List_of_file_formats#Video
			"avi",
			"flv",
			"mkv",
			"mov",
			"mpeg",
			"mpg",
			"ogv",
			"wmv",
			"webm",
			"mp4",
		],
		audio: [
			// https://en.wikipedia.org/wiki/List_of_file_formats#Sound_and_music
			"aiff",
			"raw",
			"wav",
			"flac",
			"wma",
			"brstm",
			"mp3",
			"aac",
			"ogg",
		],
		model: [
			// https://en.wikipedia.org/wiki/Image_file_formats 3d vector formats
			"glb",
			"gltf",
			"fbx",
			"obj",
			"stl",
			"dae",
			"mmd",
			"ply",
			"blend",
			"blend1",
			"ma",
			"mb",
			"3ds",
			"dxf",
		],
		text: ["txt", "doc", "docx", "mobi", "pdf", "epub", "odt"],
		font: ["bdf", "otf", "ttf", "woff"],
	};

	constructor() {}

	formatBytes(b: number) {
		if (typeof b != "number") return;

		const fixed = (n: number) => {
			if (n < 100) return n.toFixed(1);
			return Math.floor(n);
		};

		const kb = b / 1024;
		if (kb < 1024) return fixed(kb) + " KB";
		const mb = kb / 1024;
		if (mb < 1024) return fixed(mb) + " MB";
		const gb = mb / 1024;
		if (gb < 1024) return fixed(gb) + " GB";
		const tb = gb / 1024;
		if (tb < 1024) return fixed(tb) + " TB";

		return b.toFixed(2) + " B";
	}

	// downloadFile(url: string, name: string) {
	// 	const a = document.createElement("a");
	// 	a.href = url;
	// 	a.download = name;
	// 	document.body.appendChild(a);
	// 	a.click();
	// 	document.body.removeChild(a);
	// }

	// export function copyToClipboard(text: string) {
	// 	const listener = (e: ClipboardEvent) => {
	// 		const clipboard = e.clipboardData || window["clipboardData"];
	// 		clipboard.setData("text", text);
	// 		e.preventDefault();
	// 	};

	// 	document.addEventListener("copy", listener, false);
	// 	document.execCommand("copy");
	// 	document.removeEventListener("copy", listener, false);
	// }

	formatExt(fileName: string): { type: string; icon: string } {
		const ext = fileName
			.split(".")
			.pop()
			.toLowerCase();

		for (const type of Object.keys(this.fileTypes)) {
			if (this.fileTypes[type].includes(ext)) {
				if (type == "image") return { type, icon: "insert_photo" };
				if (type == "code") return { type, icon: "code" };
				if (type == "video") return { type, icon: "videocam" };
				if (type == "audio") return { type, icon: "audiotrack" };
				if (type == "model") return { type, icon: "layers" };
				if (type == "text") return { type, icon: "description" };
				if (type == "font") return { type, icon: "text_format" };
				return { type, icon: "insert_drive_file" };
			}
		}

		return { type: "file", icon: "insert_drive_file" };
	}

	displayPlural = (n: number, singular: string, plural?: string) =>
		n +
		" " +
		(n == 1 ? singular : plural != null ? plural : singular + "s");
}
