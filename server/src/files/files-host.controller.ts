import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import * as swc from "@swc/core";
import { ObjectId } from "bson";
import { Response } from "express";
import fetch from "node-fetch";
import { FILES_URL, FILES_S3_BUCKET, FILES_S3_ENDPOINT } from "../environment";
import { UserService } from "../user/user.service";

@Controller({
	host: new URL(FILES_URL).hostname,
	path: "",
})
@ApiTags("user files")
export class FilesHostController {
	private readonly s3Url =
		"https://" + FILES_S3_ENDPOINT + "/" + FILES_S3_BUCKET;

	constructor(public readonly userService: UserService) {}

	@Get("*")
	async getFile(@Param("0") location: string, @Res() res: Response) {
		const path = location.split("/");

		// validate user id
		try {
			new ObjectId(path[0]);
		} catch (error) {
			const user = await this.userService.findByUsername(path[0]);
			if (user == null) throw new NotFoundException("User not found");
			path[0] = user.id;
		}

		// fetch file response
		const fileUrl = this.s3Url + "/" + path.join("/");
		const fileRes = await fetch(fileUrl);

		// try to find typescript and compile
		if (/\.js$/i.test(location)) {
			const tsFileRes = await fetch(fileUrl.replace(/\.js$/i, ".ts"));
			if (!tsFileRes.ok) throw new NotFoundException("File not found");

			const src = await tsFileRes.text();
			const out = await swc.transform(src, {
				jsc: {
					parser: {
						syntax: "typescript",
					},
					target: "es3",
					loose: true,
				},
			});

			let code = out.code;
			if (/\.bind\(/i.test(code))
				code =
					`if (!Function.prototype.bind) {
	Function.prototype.bind = function(context) {
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1);
				  
		if (typeof fn !== 'function') {
			throw new TypeError('Function.prototype.bind - context must be a valid function');
		}
				  
		return function() {
			return fn.apply(context, args.concat(Array.prototype.slice.call(arguments)));
		}
	}
}
` + code;

			res.header("Content-Type", "text/javascript");
			return res.send(code);
		}

		if (!fileRes.ok) throw new NotFoundException("File not found");

		for (const header of fileRes.headers) {
			res.header(header[0], header[1]);
		}

		fileRes.body.pipe(res);
	}
}
