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
import { MulterFile } from "src/common/multer-file.model";

export class UserFileUploadDto {
	@ApiProperty({ type: "string", format: "binary" })
	file: any;
}

@Injectable()
export class FilesService {
	private readonly bucket: string;
	private readonly spaces: AWS.S3;
	readonly maxSize = 1024 * 1024 * 100; // 100 MB

	constructor() {
		this.bucket = FILES_S3_BUCKET;
		this.spaces = new AWS.S3({
			endpoint: FILES_S3_ENDPOINT,
			accessKeyId: FILES_S3_KEY_ID,
			secretAccessKey: FILES_S3_SECRET_KEY,
		});
	}

	private validatePath(userId: string, pathStr: string) {
		if (!path.isAbsolute(pathStr))
			throw new BadRequestException("Absolute paths only");

		return path.posix.join(userId, pathStr);
	}

	async getFiles(userId: string, pathStr: string) {
		const prefix = this.validatePath(userId, pathStr);

		const objects = await this.spaces
			.listObjectsV2({
				Bucket: this.bucket,
				Prefix: prefix,
			})
			.promise();

		const files = objects.Contents.map(object => ({
			key: object.Key.replace(userId, ""),
			lastModified: object.LastModified,
			size: object.Size,
			url: FILES_S3_URL + "/" + object.Key,
		}));

		return files;
	}

	async uploadFile(userId: string, pathStr: string, file: MulterFile) {
		const key = this.validatePath(userId, pathStr);

		const userSize = await this.getUserSize(userId);
		if (userSize >= this.maxSize)
			throw new BadRequestException(
				"File storage full " + userSize + "/" + this.maxSize,
			);

		await this.spaces
			.upload({
				Bucket: this.bucket,
				Key: key,
				Body: file.buffer,
				ContentType: file.mimetype,
				ACL: "public-read",
				CacheControl: "no-cache",
			})
			.promise();

		return {
			url: FILES_S3_URL + "/" + key,
			size: file.buffer.length,
		};
	}

	async deleteFile(userId: string, pathStr: string) {
		const key = this.validatePath(userId, pathStr);

		await this.spaces
			.deleteObject({
				Bucket: this.bucket,
				Key: key,
			})
			.promise();

		return true;
	}

	async getUserSize(userId: string) {
		const prefix = this.validatePath(userId, "/");

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
}
