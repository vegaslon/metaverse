import {
	Controller,
	Get,
	Param,
	Post,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes } from "@nestjs/swagger";
import { Request, Response } from "express";
import fetch from "node-fetch";
import { MetaverseAuthGuard } from "../auth/guards/auth.guard";
import { CurrentUser } from "../auth/user.decorator";
import { MulterFile } from "../common/multer-file.model";
import { User } from "../user/user.schema";
import { AttachmentUploadDto, FilesService } from "./files.service";

// for _handleFile
let _filesService: FilesService;

@Controller("api/attachments")
export class AttachmentsController {
	constructor(public readonly filesService: FilesService) {
		_filesService = filesService;
	}

	@Post("upload")
	@ApiBearerAuth()
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		description: "File to upload",
		type: AttachmentUploadDto,
	})
	@UseGuards(MetaverseAuthGuard)
	@UseInterceptors(
		FileInterceptor("file", {
			limits: {
				fileSize: 1000 * 1000 * 50, // 50 MB
			},
			storage: new (function () {
				this._handleFile = (req, file, cb) => {
					_filesService
						.uploadAttachment(req.user, file)
						.then(data => {
							console.log("hi", data);
							cb(null, { data });
						})
						.catch(err => {
							cb(err);
						});
				};
			})(),
		}),
	)
	async uploadAttachment(
		@CurrentUser() user: User,
		@UploadedFile() file: MulterFile & { data: any },
	) {
		return file.data;
	}

	@Get(":key")
	async getAttachments(
		@Param("key") key: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// fetch file response
		const fileUrl = await this.filesService.getAttachmentObjectUrl(key);

		const reqHeaders = JSON.parse(JSON.stringify(req.headers));
		delete reqHeaders.host;
		delete reqHeaders["content-length"];
		delete reqHeaders["content-type"];

		const fileRes = await fetch(fileUrl, {
			headers: reqHeaders,
		});

		// clean up headers

		const headers: { [key: string]: string } = {};
		for (const header of fileRes.headers) {
			const key = header[0].toLowerCase();
			if (
				key == "alt-svc" ||
				key == "server" ||
				key == "x-guploader-uploadid" ||
				key.startsWith("x-goog")
			) {
				continue;
			}
			headers[header[0]] = header[1];
		}

		// force .fst files as text/plain
		if (/\.fst$/i.test(key)) {
			headers["Content-Type"] = "text/plain";
		}

		if (req.query.download != null) {
			headers["Content-Disposition"] = "attachment";
		}

		if (res) {
			res.status(fileRes.status);
			for (const header of Object.entries(headers)) {
				res.setHeader(header[0], header[1]);
			}
			fileRes.body.pipe(res);
		}

		// this.metricsService.metrics.fileReadsPerMinute++;

		// return {
		// 	status: fileRes.status,
		// 	headers,
		// 	body: fileRes.body,
		// };
	}
}
