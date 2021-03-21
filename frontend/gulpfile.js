const { src, dest } = require("gulp");
const through2 = require("through2-concurrent");
const { brotliCompress } = require("zlib");
const log = require("fancy-log");
const chalk = require("chalk");
const os = require("os");
const {
	BROTLI_PARAM_QUALITY,
	BROTLI_PARAM_SIZE_HINT,
} = require("zlib").constants;
const prettyBytes = require("pretty-bytes");
const sharp = require("sharp");

const maxConcurrency = os.cpus().length;

function avifOrWebp(type, quality, keepPngLossless) {
	if (type != "avif" && type != "webp")
		throw new Error('Please specify type "avif" or "webp"');

	let totalFiles = 0;
	let totalBytes = 0;
	let totalSavedBytes = 0;

	return through2.obj(
		{ maxConcurrency },
		(file, encoding, callback) => {
			const lowerPath = file.path.toLowerCase();
			if (
				file.isNull() ||
				file.isStream() ||
				file.isDirectory() ||
				file.isSymbolic() ||
				!(
					lowerPath.endsWith(".jpg") ||
					lowerPath.endsWith(".jpeg") ||
					lowerPath.endsWith(".png")
				)
			) {
				return callback(null, file);
			}

			totalFiles++;
			totalBytes += file.contents.length;

			const lossless = keepPngLossless && lowerPath.endsWith(".png");

			let sharpFile = sharp(file.contents);
			sharpFile =
				type == "webp"
					? sharpFile.webp({ quality, lossless })
					: sharpFile.avif({ quality, lossless, speed: 0 });

			sharpFile
				.toBuffer()
				.then(data => {
					totalSavedBytes += file.contents.length - data.length;
					file.contents = data;
					file.path = file.path.replace(
						/\.(jpe?g|png)$/i,
						"." + type,
					);

					callback(null, file);
				})
				.catch(error => {
					return callback(error);
				});
		},
		callback => {
			log(
				`${type}: ${totalFiles} images, saved ${chalk.green(
					prettyBytes(totalSavedBytes),
				)}, ${chalk.gray(
					`${prettyBytes(totalBytes)} => ${prettyBytes(
						totalBytes - totalSavedBytes,
					)}`,
				)}`,
			);
			callback();
		},
	);
}

function brotli(quality) {
	let totalFiles = 0;
	let totalBytes = 0;
	let totalSavedBytes = 0;

	return through2.obj(
		{ maxConcurrency },
		(file, encoding, callback) => {
			if (
				file.isNull() ||
				file.isStream() ||
				file.isDirectory() ||
				file.isSymbolic()
			) {
				return callback(null, file);
			}

			totalFiles++;
			totalBytes += file.contents.length;

			brotliCompress(
				file.contents,
				{
					params: {
						[BROTLI_PARAM_QUALITY]: quality,
						[BROTLI_PARAM_SIZE_HINT]: file.contents.length,
					},
				},
				(error, data) => {
					if (error) return callback(error);

					totalSavedBytes += file.contents.length - data.length;
					file.contents = data;
					file.path += ".br";

					callback(null, file);
				},
			);
		},
		callback => {
			log(
				`brotli: ${totalFiles} files, saved ${chalk.green(
					prettyBytes(totalSavedBytes),
				)}, ${chalk.gray(
					`${prettyBytes(totalBytes)} => ${prettyBytes(
						totalBytes - totalSavedBytes,
					)}`,
				)}`,
			);
			callback();
		},
	);
}

// function statsForExt(extSizeMap, type) {
// 	if (type == "before") {
// 		return through2.obj((file, _, callback) => {
// 			file.ext = require("path").extname(file.path).toLowerCase();
// 			if (extSizeMap[file.ext] == null) {
// 				extSizeMap[file.ext] = [0, 0];
// 			}
// 			extSizeMap[file.ext][0] += file.contents.length;
// 			callback(null, file);
// 		});
// 	} else if (type == "after") {
// 		return through2.obj((file, _, callback) => {
// 			extSizeMap[file.ext][1] += file.contents.length;
// 			callback(null, file);
// 		});
// 	}
// }

// function printStatsForExt(extSizeMap) {
// 	for (const [ext, size] of Object.entries(extSizeMap)) {
// 		let percent = Math.floor(100 - (size[1] / size[0]) * 100);
// 		if (percent < 0) percent = 0;
// 		const goodGain = percent > 10;
// 		log(ext + " " + (goodGain ? chalk.green : chalk.red)(percent + "%"));
// 	}
// }

function listForBrotli(input) {
	return [
		".js",
		".txt",
		".ico",
		".html",
		".pdf",
		".json",
		".xml",
		".css",
		".svg",
		".ts",
		".ttf",
	].map(ext => input + ext);
}

function optimize(callback) {
	const optimizeImages = type =>
		src([
			"dist/browser/**/*.jpg",
			"dist/browser/**/*.jpeg",
			"dist/browser/**/*.png",
		])
			.pipe(avifOrWebp(type, 80, false))
			.pipe(dest("dist/browser/"));

	// const extSizeMap = {};
	// const optimizeFiles = () =>
	// 	src(["dist/browser/**/*.*", "!dist/browser/**/*.br"])
	// 		.pipe(statsForExt(extSizeMap, "before"))
	// 		.pipe(brotli(11))
	// 		.pipe(statsForExt(extSizeMap, "after"))
	// 		.pipe(dest("dist/browser/"));

	const optimizeFiles = () =>
		src(listForBrotli("dist/browser/**/*"))
			.pipe(brotli(11))
			.pipe(dest("dist/browser/"));

	// optimizeImages("avif").on("finish", () => {
	optimizeImages("webp").on("finish", () => {
		optimizeFiles().on("finish", () => {
			// printStatsForExt(extSizeMap);
			callback();
		});
	});
	// });
}

exports.optimize = optimize;
