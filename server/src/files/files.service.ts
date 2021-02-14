import { Bucket, File, Storage } from "@google-cloud/storage";
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import fetch from "node-fetch";
import * as path from "path";
import { from, merge } from "rxjs";
import { rxToStream, streamToRx } from "rxjs-stream";
import { map } from "rxjs/operators";
import sharp from "sharp";
import { Readable } from "stream";
import { MulterStream } from "../common/multer-file.model";
import { getMimeType } from "../common/utils";
import {
	FILES_GCP_AUTH_JSON,
	FILES_GCP_BUCKET,
	FILES_GCP_PROJECT_ID,
	FILES_URL,
} from "../environment";
import { MetricsService } from "../metrics/metrics.service";
import { User } from "../user/user.schema";

export class UserFileUploadDto {
	@ApiProperty({ type: "string", required: true })
	path: string;

	@ApiProperty({ type: "string", required: true, format: "binary" })
	file: any;
}

interface GoogleFileMetadata {
	kind: string;
	id: string;
	selfLink: string;
	mediaLink: string;
	name: string;
	bucket: string;
	generation: string;
	metageneration: string;
	contentType: string;
	storageClass: string;
	size: string;
	md5Hash: string;
	contentEncoding: string;
	crc32c: string;
	etag: string;
	timeCreated: Date;
	updated: Date;
	timeStorageClassUpdated: Date;
	metadata: { [key: string]: string } | null;
}

export interface UserFile {
	key: string;
	updated: Date;
	size: number;
}

@Injectable()
export class FilesService {
	// private readonly bucket: string;
	// private readonly s3: AWS.S3;

	private readonly storage: Storage;
	private readonly bucket: Bucket;

	constructor(private readonly metricsService: MetricsService) {
		// this.bucket = FILES_S3_BUCKET;

		// const regionMatches = FILES_S3_ENDPOINT.match(
		// 	/s3-([^]+?-[^]+?-[0-9])+?\.amazonaws\.com/i,
		// );

		// this.s3 = new AWS.S3({
		// 	endpoint: FILES_S3_ENDPOINT,
		// 	accessKeyId: FILES_S3_KEY_ID,
		// 	secretAccessKey: FILES_S3_SECRET_KEY,

		// 	region:
		// 		regionMatches && regionMatches.length > 0
		// 			? regionMatches[1]
		// 			: null,
		// 	signatureVersion: "v4",

		// 	// s3ForcePathStyle: true, // when using minio
		// });

		this.storage = new Storage({
			projectId: FILES_GCP_PROJECT_ID,
			credentials: JSON.parse(FILES_GCP_AUTH_JSON),
		});
		this.bucket = this.storage.bucket(FILES_GCP_BUCKET);
	}

	private getMaxUserSize(user: User) {
		if (user.admin) {
			return -1;
		} else {
			return 1024 * 1024 * 1024 * user.maxFilesSize; // per GB
		}
	}

	private validatePath(user: User, pathStr: string, isFolder = false) {
		// must start with /
		if (!path.isAbsolute(pathStr))
			throw new BadRequestException("Absolute paths only");

		// no /../
		if (/\/\.\.\//.test(pathStr))
			throw new BadRequestException("Invalid path");

		// just making sure we're always in the user folder
		const finalPath = path.posix.normalize(
			path.posix.join(user.id, pathStr),
		);
		if (!finalPath.startsWith(user.id + "/"))
			throw new BadRequestException("Invalid path");

		if (!isFolder) {
			return finalPath;
		} else {
			return finalPath.endsWith("/") ? finalPath : finalPath + "/";
		}
	}

	private async getUserSize(user: User) {
		const prefix = this.validatePath(user, "/");

		// const objects = await this.s3
		// 	.listObjectsV2({
		// 		Bucket: this.bucket,
		// 		Prefix: prefix,

		// 		// TODO: count more than 1000 files
		// 		//ContinuationToken: "",
		// 	})
		// 	.promise();

		// const size = objects.Contents.reduce(
		// 	(total, object) => total + object.Size,
		// 	0,
		// );

		const [files] = await this.bucket.getFiles({
			prefix,
		});

		const size = files.reduce(
			(total, file) =>
				total + parseInt((file.metadata as GoogleFileMetadata).size),
			0,
		);

		return size;
	}

	private getUrl(user: User, key: string) {
		return (
			FILES_URL +
			"/" +
			key.replace(
				new RegExp("^" + user.id + "/"),
				user.username.toLowerCase() + "/",
			)
		);
	}

	async getFiles(
		user: User,
		pathStr: string,
	): Promise<{ url: string; files: UserFile[] }> {
		const prefix = this.validatePath(user, pathStr);

		// const objects = await this.s3
		// 	.listObjectsV2({
		// 		Bucket: this.bucket,
		// 		Prefix: prefix,
		// 	})
		// 	.promise();

		// return objects.Contents.map(object => ({
		// 	key: object.Key.replace(user.id, ""),
		// 	lastModified: object.LastModified,
		// 	size: object.Size,
		// 	url: this.getUrl(user, object.Key),
		// }));

		const [files] = await this.bucket.getFiles({
			prefix,
		});

		return {
			url: FILES_URL + "/" + user.username.toLowerCase(),
			files: files.map(file => {
				const metadata: GoogleFileMetadata = file.metadata;
				const tea =
					metadata.metadata == null
						? false
						: metadata.metadata.tea == "true";

				return {
					key: metadata.name.replace(user.id, ""),
					updated: metadata.updated,
					size: parseInt(metadata.size),
					tea,
				};
			}),
		};
	}

	async uploadFile(
		user: User,
		pathStr: string,
		file: MulterStream,
		teaOnly = false,
	) {
		const key = this.validatePath(user, pathStr);
		const maxUserSize = this.getMaxUserSize(user);
		const userSize = await this.getUserSize(user);

		if (maxUserSize != -1 && userSize >= maxUserSize)
			throw new BadRequestException("Storage is full");

		let bodyLength = 0;
		const body = rxToStream(
			streamToRx(file.stream).pipe(
				map(buffer => {
					bodyLength += buffer.length;

					if (maxUserSize != -1 && bodyLength >= maxUserSize)
						throw new BadRequestException("Storage is full");

					return buffer;
				}),
			),
			{
				objectMode: true,
			},
		);

		// await this.s3
		// 	.upload({
		// 		Bucket: this.bucket,
		// 		Key: key,
		// 		Body: body,
		// 		ContentType: mimetype,
		// 		//ACL: "public-read",
		// 		//CacheControl: "no-cache",
		// 	})
		// 	.promise();

		const blob = this.bucket.file(key, {});
		const stream = blob.createWriteStream({
			private: true,
			contentType: getMimeType(key),
			gzip: false,
			metadata: {
				metadata: {
					tea: teaOnly,
				},
			},
		});

		body.pipe(stream);
		await new Promise(resolve => stream.on("finish", resolve));

		this.metricsService.metrics.fileWritesPerMinute++;

		return {
			url: this.getUrl(user, key),
			size: bodyLength,
		};
	}

	async createFolder(user: User, pathStr: string) {
		const key = this.validatePath(user, pathStr, true);

		// await this.s3
		// 	.upload({
		// 		Bucket: this.bucket,
		// 		Key: key,
		// 		Body: "",
		// 		//ACL: "public-read",
		// 	})
		// 	.promise();

		const folder = this.bucket.file(key);
		await folder.save(null, {
			private: true,
		});

		return {
			url: this.getUrl(user, key),
		};
	}

	async deleteFile(user: User, pathStr: string) {
		const key = this.validatePath(user, pathStr);

		// await this.s3
		// 	.deleteObject({
		// 		Bucket: this.bucket,
		// 		Key: key,
		// 	})
		// 	.promise();

		await this.bucket.file(key).delete();

		return true;
	}

	async deleteFolder(user: User, pathStr: string) {
		const prefix = this.validatePath(user, pathStr, true);

		// const listObjects = await this.s3
		// 	.listObjectsV2({
		// 		Bucket: this.bucket,
		// 		Prefix: prefix,
		// 	})
		// 	.promise();

		// const res = await this.s3
		// 	.deleteObjects({
		// 		Bucket: this.bucket,
		// 		Delete: {
		// 			Objects: listObjects.Contents.map(object => ({
		// 				Key: object.Key,
		// 			})),
		// 		},
		// 	})
		// 	.promise();

		// return {
		// 	deleted: res.Deleted.length,
		// };

		await this.bucket.deleteFiles({
			prefix,
		});

		return true;
	}

	async moveFile(user: User, oldPathStr: string, newPathStr: string) {
		const oldKey = this.validatePath(user, oldPathStr);
		const newKey = this.validatePath(user, newPathStr);

		// await this.s3
		// 	.copyObject({
		// 		CopySource: "/" + this.bucket + "/" + oldKey,
		// 		Bucket: this.bucket,
		// 		Key: newKey,
		// 		//ACL: "public-read",
		// 	})
		// 	.promise();

		// if (oldKey != newKey)
		// 	await this.s3
		// 		.deleteObject({
		// 			Bucket: this.bucket,
		// 			Key: oldKey,
		// 		})
		// 		.promise();

		const file = this.bucket.file(oldKey);

		// fix content type
		const metadata = await file.getMetadata();
		if (metadata.length > 0) {
			const contentType = getMimeType(newPathStr);
			if (metadata[0].contentType != contentType) {
				metadata[0].contentType = contentType;
				await file.setMetadata(metadata[0]);
			}
		}

		await file.move(newKey);

		return {
			old: oldKey.replace(user.id, ""),
			new: newKey.replace(user.id, ""),
		};
	}

	async moveFolder(user: User, oldPathStr: string, newPathStr: string) {
		const oldKey = this.validatePath(user, oldPathStr, true);
		const newKey = this.validatePath(user, newPathStr, true);

		const [files] = await this.bucket.getFiles({
			prefix: oldKey,
		});

		const concurrency = 16;

		try {
			await merge(
				...files.map(file =>
					from(file.move(file.name.replace(oldKey, newKey))),
				),
				concurrency,
			).toPromise();
		} catch (err) {
			throw new InternalServerErrorException();
		}
	}

	async toggleTeaOnlyFile(user: User, path: string, forceTea = null) {
		const key = this.validatePath(user, path, false);

		const file = this.bucket.file(key);

		const metadata = await file.getMetadata();
		if (metadata.length > 0) {
			let customMetadata = metadata[0].metadata ?? {};

			const tea =
				forceTea != null ? forceTea : !(customMetadata.tea == "true");
			customMetadata.tea = tea;

			metadata[0].metadata = customMetadata;
			await file.setMetadata(metadata[0]);

			return { tea };
		} else {
			return { tea: false };
		}
	}

	async toggleTeaOnlyFolder(user: User, path: string) {
		const key = this.validatePath(user, path, true);

		const files: File[] = (
			await this.bucket.getFiles({
				prefix: key,
			})
		)[0];

		let tea = files.every(
			f => f.metadata.metadata && f.metadata.metadata.tea == "true",
		);
		tea = !tea;

		const promises: Promise<any>[] = [];
		for (const file of files) {
			const path = file.name.replace(
				new RegExp("^" + user.id + "/"),
				"/",
			);
			promises.push(this.toggleTeaOnlyFile(user, path, tea));
		}

		await Promise.all(promises);

		return { tea };
	}

	async getStatus(user: User) {
		const size = await this.getUserSize(user);
		const maxSize = this.getMaxUserSize(user);

		return {
			usedSize: size,
			maxSize,
		};
	}

	async getObjectUrl(pathStr: string, getMetadata = false) {
		// return this.s3.getSignedUrl("getObject", {
		// 	Bucket: this.bucket,
		// 	Key: pathStr,
		// 	Expires: 60,
		// });

		const file = this.bucket.file(pathStr);

		const url = (
			await file.getSignedUrl({
				action: "read",
				expires: Date.now() + 1000 * 60,
			})
		)[0];

		if (getMetadata) {
			try {
				const metadata = (await file.getMetadata())[0];
				return { url, metadata };
			} catch (err) {
				return { url, metadata: {} };
			}
		} else {
			return { url, metadata: {} };
		}
	}

	async readyPlayerMe(user: User, name: string, avatarUrl: string) {
		if (!name) throw new BadRequestException("Name required");
		if (!avatarUrl) throw new BadRequestException("Avatar url required");

		const avatarRes = await fetch(avatarUrl);
		if (!avatarRes.ok)
			throw new BadRequestException("Failed to fetch avatar url");

		const keyPrefix = "/ready-player-me/" + name.replace(/[\n\r]/g, "");

		const glbBuffer = await avatarRes.buffer();
		// const gltf = await glbToGltf(glbBuffer, {
		// 	separate: true,
		// 	separateTextures: true,
		// });

		const upload = async (
			filename: string,
			buffer: Buffer,
			teaOnly = true,
		) => {
			// const newBuffer = await new Promise<Buffer>((resolve, reject) => {
			// 	zlib.brotliCompress(
			// 		buffer,
			// 		{
			// 			params: {
			// 				[zlib.constants.BROTLI_PARAM_QUALITY]: 4,
			// 			},
			// 		},
			// 		(error, result) => {
			// 			if (error) return reject(error);
			// 			resolve(result);
			// 		},
			// 	);
			// });
			await this.uploadFile(
				user,
				keyPrefix + "/" + filename,
				{ stream: Readable.from(buffer) } as any,
				teaOnly,
			);
		};

		const fst = [
			"name = " + name,
			"type = body+head",
			"scale = 1",
			"filename = avatar.glb",
			"preview = avatar.jpg",
			"bs = JawOpen = mouthOpen = 3",
			"bs = EyeBlink_L = eyeBlinkLeft = 1",
			"bs = EyeBlink_R = eyeBlinkRight = 1",
		].join("\n");

		const uploads: Promise<any>[] = [
			// upload("avatar.gltf", Buffer.from(JSON.stringify(gltf.gltf))),
			upload("avatar.glb", glbBuffer),
			upload("avatar.fst", Buffer.from(fst)),
		];

		// try to make preview asynchronously
		(async () => {
			const avatarRenderRes = await fetch(
				"https://cyberpunk.readyplayer.me/api/render_image?url=" +
					avatarUrl +
					"&target=cyberpunk",
			);
			if (avatarRenderRes.ok) {
				try {
					const buffer = await avatarRenderRes.buffer();
					const image = sharp(
						Buffer.from(
							buffer
								.toString()
								.replace(/^data:[^]*?;base64,/i, ""),
							"base64",
						),
					);
					// const width = (await image.metadata()).width;
					const jpgBuffer = await image
						.extract({
							top: 80,
							left: 220,
							width: 650,
							height: 650,
						})
						.jpeg({
							quality: 90,
						})
						.toBuffer();
					upload("avatar.jpg", jpgBuffer, false);
				} catch (err) {}
			}
		})();

		// for (const [key, buffer] of Object.entries(gltf.separateResources)) {
		// 	uploads.push(upload(key, buffer as Buffer));
		// }

		await Promise.all(uploads);

		return {
			// avatarUrl:
			// 	FILES_URL +
			// 	"/" +
			// 	user.username.toLowerCase() +
			// 	encodeURI(keyPrefix) +
			// 	"/avatar.fst",
			avatarUrl:
				"tea://" +
				user.username.toLowerCase() +
				encodeURI(keyPrefix) +
				"/avatar.fst",
		};
	}
}
