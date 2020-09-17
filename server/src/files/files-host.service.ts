import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";
import fetch, { Response as FetchResponse } from "node-fetch";
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

	private setHeaders(fromRes: FetchResponse, toRes: ExpressResponse) {
		const headers = [
			"Content-Length",
			"Content-Type",
			"Last-Modified",
			"ETag",
		];
		const exportedHeaders = {};

		const setHeader = (key: string, value: string) => {
			if (toRes) toRes.header(key, value);
			exportedHeaders[key] = value;
		};

		for (const header of fromRes.headers) {
			const lowerKey = header[0].toLowerCase();
			const value = header[1];

			const key = headers.find(
				queryKey => queryKey.toLowerCase() == lowerKey,
			);

			if (key != null) setHeader(key, value);
		}

		return exportedHeaders;
	}

	private forceDownload(res: ExpressResponse) {
		res.header("Content-Disposition", "attachment");
	}

	async getFile(
		req: ExpressRequest,
		res: ExpressResponse,
		path: string,
		query: { [key: string]: string } = {},
	) {
		const filePath = path.split("/");
		if (filePath.some(part => part == ".."))
			throw new BadRequestException();

		// resolve user
		const user = await this.userService.findByIdOrUsername(filePath[0]);
		if (user == null) throw new NotFoundException("User not found");
		filePath[0] = user.id;

		// fetch file response
		const fileUrl = (
			await this.filesService.getObjectUrl(filePath.join("/"))
		)[0];

		const requestHeaders = req.headers as { [key: string]: string };
		delete requestHeaders.host;
		const fileRes = await fetch(fileUrl, {
			headers: requestHeaders,
		});

		if (!fileRes.ok) throw new NotFoundException("File not found");

		let headers: { [key: string]: string } = {};

		if (res) {
			// force .fst files as text/plain
			if (/\.fst$/i.test(path)) {
				fileRes.headers.set("Content-Type", "text/plain");
			}

			if (query.download != null) this.forceDownload(res);

			headers = this.setHeaders(fileRes, res);
			res.status(fileRes.status);
			fileRes.body.pipe(res);
		} else {
			headers = this.setHeaders(fileRes, null);
		}

		this.metricsService.metrics.fileReadsPerMinute++;

		return {
			stream: fileRes.body,
			headers,
			status: fileRes.status,
		};
	}
}
