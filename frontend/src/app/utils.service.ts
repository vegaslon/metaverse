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

			"svg",
		],
		image_document: [
			"afphoto",
			"kra",
			"psd",
			"sai",
			"xcf",

			"afdesign",
			"ai",

			"dds",
			"ktx",
		],
		code: [
			"fst",
			// monaco.languages
			// 	.getLanguages()
			// 	.map(language =>
			// 		language.extensions.map(ext => ext.replace(/^\./, "")),
			// 	)
			// 	.reduce((a, b) => [...a, ...b]);
			"txt",
			"gitignore",
			"json",
			"bowerrc",
			"jshintrc",
			"jscsrc",
			"eslintrc",
			"babelrc",
			"har",
			"abap",
			"cls",
			"azcli",
			"bat",
			"cmd",
			"mligo",
			"clj",
			"cljs",
			"cljc",
			"edn",
			"coffee",
			"c",
			"h",
			"cpp",
			"cc",
			"cxx",
			"hpp",
			"hh",
			"hxx",
			"cs",
			"csx",
			"cake",
			"css",
			"dockerfile",
			"fs",
			"fsi",
			"ml",
			"mli",
			"fsx",
			"fsscript",
			"go",
			"graphql",
			"gql",
			"handlebars",
			"hbs",
			"html",
			"htm",
			"shtml",
			"xhtml",
			"mdoc",
			"jsp",
			"asp",
			"aspx",
			"jshtm",
			"ini",
			"properties",
			"gitconfig",
			"java",
			"jav",
			"js",
			"es6",
			"jsx",
			"kt",
			"less",
			"lua",
			"md",
			"markdown",
			"mdown",
			"mkdn",
			"mkd",
			"mdwn",
			"mdtxt",
			"mdtext",
			"s",
			"dax",
			"msdax",
			"m",
			"pas",
			"p",
			"pp",
			"ligo",
			"pl",
			"php",
			"php4",
			"php5",
			"phtml",
			"ctp",
			"dats",
			"sats",
			"hats",
			"pq",
			"pqm",
			"ps1",
			"psm1",
			"psd1",
			"jade",
			"pug",
			"py",
			"rpy",
			"pyw",
			"cpy",
			"gyp",
			"gypi",
			"r",
			"rhistory",
			"rprofile",
			"rt",
			"cshtml",
			"redis",
			"rst",
			"rb",
			"rbx",
			"rjs",
			"gemspec",
			"pp",
			"rs",
			"rlib",
			"sb",
			"scm",
			"ss",
			"sch",
			"rkt",
			"scss",
			"sh",
			"bash",
			"sol",
			"aes",
			"sql",
			"st",
			"iecst",
			"iecplc",
			"lc3lib",
			"swift",
			"tcl",
			"twig",
			"ts",
			"tsx",
			"vb",
			"xml",
			"dtd",
			"ascx",
			"csproj",
			"config",
			"wxi",
			"wxl",
			"wxs",
			"xaml",
			"svg",
			"svgz",
			"opf",
			"xsl",
			"yaml",
			"yml",
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
		text: ["doc", "docx", "mobi", "pdf", "epub", "odt"],
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
		const ext = fileName.split(".").pop().toLowerCase();

		for (const type of Object.keys(this.fileTypes)) {
			if (this.fileTypes[type].includes(ext)) {
				if (type == "image") return { type, icon: "insert_photo" };
				if (type == "image_document")
					return { type, icon: "insert_photo" };
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
		(n === 1 ? singular : plural != null ? plural : singular + "s");

	displayPluralName = (name: string) =>
		name.toLowerCase().endsWith("s") ? name + "'" : name + "'s";

	displayMinutes(mins: number): string {
		if (mins >= 60) {
			const hours = Math.floor(mins / 60);
			mins = mins - hours * 60;
			return (
				this.displayPlural(hours, "hour") +
				" " +
				this.displayPlural(mins, "minute")
			);
		} else {
			return mins + (mins === 1 ? " minute" : " minutes");
		}
	}

	getEmailDomain = (email: string) => email.split("@").pop();

	downloadBlob = (blob: Blob, filename: string) => {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		document.body.appendChild(a);
		a.setAttribute("style", "display: none");
		a.href = url;
		a.download = filename;
		a.click();
		window.URL.revokeObjectURL(url);
		a.remove();
	};
}
