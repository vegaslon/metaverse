import { Bucket, Storage } from "@google-cloud/storage";
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { existsSync, readFileSync } from "fs";
import * as path from "path";
import { from, merge } from "rxjs";
import { rxToStream, streamToRx } from "rxjs-stream";
import { map } from "rxjs/operators";
import { MulterStream } from "../common/multer-file.model";
import {
	FILES_GCP_BUCKET,
	FILES_GCP_JSON_PATH,
	FILES_GCP_PROJECT_ID,
	FILES_URL,
} from "../environment";
import { User } from "../user/user.schema";

export class UserFileUploadDto {
	@ApiProperty({ type: "string", required: true })
	path: String;

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
}

export interface UserFile {
	key: string;
	updated: Date;
	size: number;
	url: string;
}

@Injectable()
export class FilesService {
	// private readonly bucket: string;
	// private readonly s3: AWS.S3;

	private readonly storage: Storage;
	private readonly bucket: Bucket;

	constructor() {
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
			credentials: JSON.parse(
				existsSync(FILES_GCP_JSON_PATH)
					? readFileSync(FILES_GCP_JSON_PATH, "utf8")
					: "{}",
			),
		});
		this.bucket = this.storage.bucket(FILES_GCP_BUCKET);
	}

	private getMaxUserSize(user: User) {
		if (user.admin) {
			return -1;
		} else {
			return 1024 * 1024 * 100;
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

	async getFiles(user: User, pathStr: string): Promise<UserFile[]> {
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

		return files.map(file => {
			const metadata: GoogleFileMetadata = file.metadata;

			return {
				key: metadata.name.replace(user.id, ""),
				updated: metadata.updated,
				size: parseInt(metadata.size),
				url: this.getUrl(user, metadata.name),
			};
		});
	}

	async uploadFile(user: User, pathStr: string, file: MulterStream) {
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

		let mimetype = file.mimetype;
		if (key.toLowerCase().endsWith(".ts")) mimetype = "text/typescript";

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
			gzip: true,
			private: true,
			contentType: mimetype,
		});

		body.pipe(stream);
		await new Promise(resolve => stream.on("finish", resolve));

		return {
			url: this.getUrl(user, key),
			size: bodyLength,
		};
	}

	async createFolder(user: User, pathStr: string) {
		let key = this.validatePath(user, pathStr, true);

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

		await this.bucket.file(oldKey).move(newKey);

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

	async getStatus(user: User) {
		const size = await this.getUserSize(user);
		const maxSize = this.getMaxUserSize(user);

		return {
			usedSize: size,
			maxSize,
		};
	}

	getObjectUrl(pathStr: string) {
		// return this.s3.getSignedUrl("getObject", {
		// 	Bucket: this.bucket,
		// 	Key: pathStr,
		// 	Expires: 60,
		// });

		return this.bucket.file(pathStr).getSignedUrl({
			action: "read",
			expires: Date.now() + 1000 * 60,
		});
	}
}
