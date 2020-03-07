import { BadRequestException, Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import * as AWS from "aws-sdk";
import * as path from "path";
import { rxToStream, streamToRx } from "rxjs-stream";
import { map } from "rxjs/operators";
import { MulterStream } from "../common/multer-file.model";
import {
	FILES_S3_BUCKET,
	FILES_S3_ENDPOINT,
	FILES_S3_KEY_ID,
	FILES_S3_SECRET_KEY,
	FILES_URL,
} from "../environment";
import { User } from "../user/user.schema";

export class UserFileUploadDto {
	@ApiProperty({ type: "string", required: true })
	path: String;

	@ApiProperty({ type: "string", required: true, format: "binary" })
	file: any;
}

@Injectable()
export class FilesService {
	private readonly bucket: string;
	private readonly spaces: AWS.S3;

	constructor() {
		this.bucket = FILES_S3_BUCKET;

		const regionMatches = FILES_S3_ENDPOINT.match(
			/s3-([^]+?-[^]+?-[0-9])+?\.amazonaws\.com/i,
		);

		this.spaces = new AWS.S3({
			endpoint: FILES_S3_ENDPOINT,
			accessKeyId: FILES_S3_KEY_ID,
			secretAccessKey: FILES_S3_SECRET_KEY,

			region:
				regionMatches && regionMatches.length > 0
					? regionMatches[1]
					: null,
			signatureVersion: "v4",

			// s3ForcePathStyle: true, // when using minio
		});
	}

	private getMaxUserSize(user: User) {
		if (user.admin) {
			return -1;
		} else {
			return 1024 * 1024 * 100;
		}
	}

	private async getUserSize(user: User) {
		const prefix = this.validatePath(user, "/");

		const objects = await this.spaces
			.listObjectsV2({
				Bucket: this.bucket,
				Prefix: prefix,

				// TODO: count more than 1000 files
				//ContinuationToken: "",
			})
			.promise();

		const size = objects.Contents.reduce(
			(total, object) => total + object.Size,
			0,
		);

		return size;
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

	async getFiles(user: User, pathStr: string) {
		const prefix = this.validatePath(user, pathStr);

		const objects = await this.spaces
			.listObjectsV2({
				Bucket: this.bucket,
				Prefix: prefix,
			})
			.promise();

		const files = objects.Contents.map(object => ({
			key: object.Key.replace(user.id, ""),
			lastModified: object.LastModified,
			size: object.Size,
			url: this.getUrl(user, object.Key),
		}));

		return files;
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

		await this.spaces
			.upload({
				Bucket: this.bucket,
				Key: key,
				Body: body,
				ContentType: mimetype,
				//ACL: "public-read",
				//CacheControl: "no-cache",
			})
			.promise();

		return {
			url: this.getUrl(user, key),
			size: bodyLength,
		};
	}

	async createFolder(user: User, pathStr: string) {
		let key = this.validatePath(user, pathStr, true);

		await this.spaces
			.upload({
				Bucket: this.bucket,
				Key: key,
				Body: "",
				//ACL: "public-read",
			})
			.promise();

		return {
			url: this.getUrl(user, key),
		};
	}

	async deleteFile(user: User, pathStr: string) {
		const key = this.validatePath(user, pathStr);

		await this.spaces
			.deleteObject({
				Bucket: this.bucket,
				Key: key,
			})
			.promise();

		return true;
	}

	async deleteFolder(user: User, pathStr: string) {
		const prefix = this.validatePath(user, pathStr, true);

		const listObjects = await this.spaces
			.listObjectsV2({
				Bucket: this.bucket,
				Prefix: prefix,
			})
			.promise();

		const res = await this.spaces
			.deleteObjects({
				Bucket: this.bucket,
				Delete: {
					Objects: listObjects.Contents.map(object => ({
						Key: object.Key,
					})),
				},
			})
			.promise();

		return {
			deleted: res.Deleted.length,
		};
	}

	async moveFile(user: User, oldPathStr: string, newPathStr: string) {
		let oldKey = this.validatePath(user, oldPathStr);
		let newKey = this.validatePath(user, newPathStr);

		await this.spaces
			.copyObject({
				CopySource: "/" + this.bucket + "/" + oldKey,
				Bucket: this.bucket,
				Key: newKey,
				//ACL: "public-read",
			})
			.promise();

		if (oldKey != newKey)
			await this.spaces
				.deleteObject({
					Bucket: this.bucket,
					Key: oldKey,
				})
				.promise();

		return {
			old: oldKey.replace(user.id, ""),
			new: newKey.replace(user.id, ""),
		};
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
		return this.spaces.getSignedUrl("getObject", {
			Bucket: this.bucket,
			Key: pathStr,
			Expires: 60,
		});
	}
}
