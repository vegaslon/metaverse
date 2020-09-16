import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { Response as ExpressResponse } from "express";
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
			"content-length",
			"content-type",
			"etag",
			//"last-modified",
		];
		const exportedHeaders = {};

		const setHeader = (key: string, value: string) => {
			const capitalizedKey =
				key.toLowerCase() == "etag"
					? "ETag"
					: key
							.split("-")
							.map(
								word =>
									word.slice(0, 1).toUpperCase() +
									word.slice(1).toLowerCase(),
							)
							.join("-");
			if (toRes) toRes.header(capitalizedKey, value);
			exportedHeaders[capitalizedKey] = value;
		};

		for (const header of fromRes.headers) {
			const key = header[0].toLowerCase();
			const value = header[1];

			if (headers.includes(key)) {
				if (key == "etag") {
					const hash = value.match(/^"([^]+?)"$/);
					if (hash != null) {
						setHeader(key, `W/"${hash[1]}"`);
					} else {
						setHeader(key, value);
					}
				} else {
					setHeader(key, value);
				}
			}
		}

		return exportedHeaders;
	}

	private forceDownload(res: ExpressResponse) {
		res.header("Content-Disposition", "attachment");
	}

	async getFile(
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
		const fileRes = await fetch(fileUrl);

		if (!fileRes.ok) throw new NotFoundException("File not found");

		let headers: { [key: string]: string } = {};

		if (res) {
			// force .fst files as text/plain
			if (/\.fst$/i.test(path)) {
				fileRes.headers.set("Content-Type", "text/plain");
			}

			if (query.download != null) this.forceDownload(res);

			headers = this.setHeaders(fileRes, res);
			fileRes.body.pipe(res);
		} else {
			headers = this.setHeaders(fileRes, null);
		}

		this.metricsService.metrics.fileReadsPerMinute++;

		return {
			stream: fileRes.body,
			headers,
		};
	}
}
