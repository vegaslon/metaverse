import * as babel from "@babel/core";
import {
	BadRequestException,
	Controller,
	Get,
	NotFoundException,
	Param,
	Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ObjectId } from "bson";
import { Response } from "express";
import fetch from "node-fetch";
import { FILES_S3_BUCKET, FILES_S3_ENDPOINT, FILES_URL } from "../environment";
import { UserService } from "../user/user.service";
import { functionBindPolyfill } from "./function-bind-polyfill";

@Controller({
	host: new URL(FILES_URL).hostname,
})
@ApiTags("user files")
export class FilesHostController {
	private readonly s3Url =
		"https://" + FILES_S3_ENDPOINT + "/" + FILES_S3_BUCKET;

	constructor(public readonly userService: UserService) {}

	@Get("*")
	async getFile(@Param("0") location: string, @Res() res: Response) {
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

		// try to find typescript and compile
		if (/\.js$/i.test(location)) {
			const tsFileRes = await fetch(fileUrl.replace(/\.js$/i, ".ts"));
			if (!tsFileRes.ok) throw new NotFoundException("File not found");

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

				res.header("Content-Type", "text/javascript");
				return res.send(code);
			} catch (err) {
				console.error(err);
				throw new BadRequestException("Failed to compile", err);
			}
		}

		if (!fileRes.ok) throw new NotFoundException("File not found");

		for (const header of fileRes.headers) {
			res.header(header[0], header[1]);
		}

		fileRes.body.pipe(res);
	}
}
