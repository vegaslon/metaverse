import {
	BadRequestException,
	ForbiddenException,
	HttpException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";
import fetch from "node-fetch";
import { getMimeType } from "../common/utils";
import { MetricsService } from "../metrics/metrics.service";
import { UserService } from "../user/user.service";
import { FilesService } from "./files.service";

@Injectable()
export class FilesHostService {
	constructor(
		private readonly userService: UserService,
		private readonly filesService: FilesService,
		private readonly metricsService: MetricsService,
	) {}

	private contentEncodingToExt = {
		gzip: "gz",
		br: "br",
	};

	async getFile(
		req: ExpressRequest,
		res: ExpressResponse,
		path: string,
		isTeaRequest = false,
		contentEncoding: "gzip" | "br" = null,
	) {
		const filePath = path.split("/");
		if (filePath.some(part => part == ".."))
			throw new BadRequestException();

		// resolve user
		const user = await this.userService.findByIdOrUsername(filePath[0]);
		if (user == null) throw new NotFoundException("User not found");
		filePath[0] = user.id;

		const contentEncodingExt =
			contentEncoding != null
				? "." + this.contentEncodingToExt[contentEncoding]
				: "";

		// fetch file response
		const { url: fileUrl, metadata } = await this.filesService.getObjectUrl(
			filePath.join("/") + contentEncodingExt,
			!isTeaRequest,
		);

		if (
			!isTeaRequest &&
			metadata.metadata &&
			metadata.metadata.tea == "true"
		) {
			throw new ForbiddenException();
		}

		const reqHeaders = JSON.parse(JSON.stringify(req.headers));
		delete reqHeaders.host;
		delete reqHeaders["content-length"];
		delete reqHeaders["content-type"];

		const fileRes = await fetch(fileUrl, {
			headers: reqHeaders,
		});

		// check if br or gz and make sure it doesnt reveal any info

		const acceptEncoding = (req.header("accept-encoding") ?? "")
			.split(",")
			.map(enc => enc.trim().toLowerCase());

		console.log(acceptEncoding, contentEncoding);

		if (fileRes.status >= 400) {
			if (contentEncoding == null) {
				if (acceptEncoding.includes("br")) {
					return this.getFile(req, res, path, isTeaRequest, "br");
				} else if (acceptEncoding.includes("gz")) {
					return this.getFile(req, res, path, isTeaRequest, "gzip");
				} else {
					throw new HttpException(fileRes.statusText, fileRes.status);
				}
			} else if (contentEncoding == "br") {
				if (acceptEncoding.includes("gzip")) {
					return this.getFile(req, res, path, isTeaRequest, "gzip");
				} else {
					throw new HttpException(fileRes.statusText, fileRes.status);
				}
			} else {
				throw new HttpException(fileRes.statusText, fileRes.status);
			}
		}

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

		if (res) {
			res.status(fileRes.status);
			for (const header of Object.entries(headers)) {
				res.setHeader(header[0], header[1]);
			}

			if (contentEncoding != null) {
				res.setHeader("Content-Encoding", contentEncoding);
				res.setHeader("Content-Type", getMimeType(path));
			}

			// force .fst files as text/plain
			if (/\.fst$/i.test(path)) {
				res.setHeader("Content-Type", "text/plain");
			}

			if (req.query.download != null) {
				res.setHeader("Content-Disposition", "attachment");
			}

			fileRes.body.pipe(res);
		}

		this.metricsService.metrics.fileReadsPerMinute++;

		return {
			status: fileRes.status,
			headers,
			body: fileRes.body,
		};
	}
}
