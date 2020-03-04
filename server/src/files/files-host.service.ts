import * as babel from "@babel/core";
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { ObjectId } from "bson";
import { Response as ExpressResponse } from "express";
import fetch, { Response as FetchResponse } from "node-fetch";
import { FILES_S3_BUCKET, FILES_S3_ENDPOINT } from "../environment";
import { UserService } from "../user/user.service";
import { functionBindPolyfill } from "./function-bind-polyfill";

@Injectable()
export class FilesHostService {
	private readonly s3Url =
		"https://" + FILES_S3_ENDPOINT + "/" + FILES_S3_BUCKET;

	constructor(private readonly userService: UserService) {}

	private setHeaders(fromRes: FetchResponse, toRes: ExpressResponse) {
		const headers = [
			"content-length",
			"content-type",
			"etag",
			//"last-modified",
		];

		for (const header of fromRes.headers) {
			if (headers.includes(header[0].toLowerCase())) {
				toRes.header(header[0], header[1]);
			}
		}
	}

	private forceDownload(res: ExpressResponse) {
		res.header("Content-Disposition", "attachment");
	}

	private async compileTypeScript(tsFileRes: FetchResponse) {
		const src = await tsFileRes.text();
		// const out = await swc.transform(src, {
		// 	jsc: {
		// 		parser: {
		// 			syntax: "typescript",
		// 		},
		// 		target: "es3",
		// 		loose: true,
		// 	},
		// });

		try {
			const out = babel.transform(src, {
				presets: [
					[
						"@babel/preset-env",
						{
							targets: "ie < 5",
							loose: true,
						},
					],
					[
						"@babel/preset-typescript",
						{
							allExtensions: true,
						},
					],
				],
				plugins: [
					"@babel/plugin-proposal-class-properties",
					"@babel/plugin-proposal-optional-chaining", // obj?.foo?.bar?.baz
					"@babel/plugin-proposal-nullish-coalescing-operator", // object.foo ?? "default"
					[
						"@babel/plugin-proposal-pipeline-operator",
						{ proposal: "minimal" },
					], // 64 |> sqrt
				],
			});

			let code = out.code;
			if (/\.bind\(/i.test(code))
				code = code.replace(
					'"use strict";\n',
					'"use strict";\n\n' + functionBindPolyfill,
				);

			return code;
		} catch (err) {
			console.error(err);
			throw new BadRequestException("Failed to compile", err);
		}
	}

	async getFile(
		res: ExpressResponse,
		location: string,
		query: { [key: string]: string },
	) {
		const filePath = location.split("/");

		// validate user id
		try {
			new ObjectId(filePath[0]);
		} catch (error) {
			const user = await this.userService.findByUsername(filePath[0]);
			if (user == null) throw new NotFoundException("User not found");
			filePath[0] = user.id;
		}

		// fetch file response
		const fileUrl = this.s3Url + "/" + filePath.join("/");
		const fileRes = await fetch(fileUrl);

		if (query.download != null) this.forceDownload(res);

		// try to find typescript and compile
		if (/\.js$/i.test(location)) {
			const tsFileRes = await fetch(fileUrl.replace(/\.js$/i, ".ts"));
			if (!tsFileRes.ok) throw new NotFoundException("File not found");

			const code = await this.compileTypeScript(tsFileRes);

			this.setHeaders(tsFileRes, res);
			res.header("Content-Type", "text/javascript");

			return res.send(code);
		}

		if (!fileRes.ok) throw new NotFoundException("File not found");

		this.setHeaders(fileRes, res);
		fileRes.body.pipe(res);
	}
}
