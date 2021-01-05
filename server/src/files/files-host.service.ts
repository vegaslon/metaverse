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

	async getFile(
		req: ExpressRequest,
		res: ExpressResponse,
		path: string,
		isTeaRequest = false,
	) {
		const filePath = path.split("/");
		if (filePath.some(part => part == ".."))
			throw new BadRequestException();

		// resolve user
		const user = await this.userService.findByIdOrUsername(filePath[0]);
		if (user == null) throw new NotFoundException("User not found");
		filePath[0] = user.id;

		// fetch file response
		const { url: fileUrl, metadata } = await this.filesService.getObjectUrl(
			filePath.join("/"),
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

		// make sure it doesnt reveal any info

		if (fileRes.status >= 400) {
			throw new HttpException(fileRes.statusText, fileRes.status);
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
