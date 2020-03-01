import { BadRequestException, Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";
import * as path from "path";
import {
	FILES_S3_BUCKET,
	FILES_S3_ENDPOINT,
	FILES_S3_KEY_ID,
	FILES_S3_SECRET_KEY,
	FILES_S3_URL,
} from "src/environment";
import { ApiProperty } from "@nestjs/swagger";
import { MulterFile } from "../common/multer-file.model";
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
		this.spaces = new AWS.S3({
			endpoint: FILES_S3_ENDPOINT,
			accessKeyId: FILES_S3_KEY_ID,
			secretAccessKey: FILES_S3_SECRET_KEY,
		});
	}

	private getMaxSize(user: User) {
		if (user.admin) {
			return -1;
		} else {
			return 1024 * 1024 * 100;
		}
	}

	private validatePath(user: User, pathStr: string, isFolder = false) {
		if (!path.isAbsolute(pathStr))
			throw new BadRequestException("Absolute paths only");

		const finalPath = path.posix.join(user.id, pathStr);

		if (!isFolder) {
			return finalPath;
		} else {
			return finalPath.endsWith("/") ? finalPath : finalPath + "/";
		}
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
			url: FILES_S3_URL + "/" + object.Key,
		}));

		return files;
	}

	async uploadFile(user: User, pathStr: string, file: MulterFile) {
		const key = this.validatePath(user, pathStr);
		const maxSize = this.getMaxSize(user);
		const userSize = await this.getUserSize(user);

		if (maxSize != -1 && userSize >= maxSize)
			throw new BadRequestException(
				"File storage full " + userSize + "/" + maxSize,
			);

		await this.spaces
			.upload({
				Bucket: this.bucket,
				Key: key,
				Body: file.buffer,
				ContentType: file.mimetype,
				ACL: "public-read",
				//CacheControl: "no-cache",
			})
			.promise();

		// TODO: remove cache from cdn

		return {
			url: FILES_S3_URL + "/" + key,
			size: file.buffer.length,
		};
	}

	async createFolder(user: User, pathStr: string) {
		let key = this.validatePath(user, pathStr, true);

		await this.spaces
			.upload({
				Bucket: this.bucket,
				Key: key,
				Body: "",
				ACL: "public-read",
			})
			.promise();

		return {
			url: FILES_S3_URL + "/" + key,
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

	async getUserSize(user: User) {
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

	async getStatus(user: User) {
		const size = await this.getUserSize(user);
		const maxSize = this.getMaxSize(user);

		return {
			usedSize: size,
			maxSize,
		};
	}
}
