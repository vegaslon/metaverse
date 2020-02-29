export function formatBytes(b: number) {
	if (typeof b != "number") return;

	const fixed = (n: number) => {
		if (n < 10) return n.toFixed(1);
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

export function downloadFile(url: string, name: string) {
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

export function copyToClipboard(text: string) {
	const listener = (e: ClipboardEvent) => {
		const clipboard = e.clipboardData || window["clipboardData"];
		clipboard.setData("text", text);
		e.preventDefault();
	};

	document.addEventListener("copy", listener, false);
	document.execCommand("copy");
	document.removeEventListener("copy", listener, false);
}

export function formatExt(fileName: string) {
	switch (
		fileName
			.split(".")
			.pop()
			.toLowerCase()
	) {
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "ktx":
		case "apng":
		case "bmp":
		case "tga":
		case "tif":
		case "tiff":
		case "svg":
		case "dds":
			return { type: "image", icon: "insert_photo" };
		case "js":
		case "jsx":
		case "ts":
		case "tsx":
		case "cpp":
		case "c":
		case "hpp":
		case "h":
		case "json":
		case "glsl":
		case "fs":
		case "vs":
			return { type: "code", icon: "code" };
		default:
			return { type: "file", icon: "insert_drive_file" };
	}
}
