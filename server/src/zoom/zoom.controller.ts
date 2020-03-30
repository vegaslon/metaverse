import { Controller, Get, Param, Res } from "@nestjs/common";
import * as crypto from "crypto";
import { Response } from "express";
import * as path from "path";
import { ZOOM_API_KEY, ZOOM_API_SECRET } from "../environment";
import { ApiTags } from "@nestjs/swagger";

@Controller("api/zoom")
@ApiTags("zoom")
export class ZoomController {
	@Get("signature/:meetingNumber")
	getSignature(@Param("meetingNumber") meetingNumber: string) {
		const role = 0; // join = 0, start = 1

		const timestamp = Date.now() - 30000;
		const msg = Buffer.from(
			ZOOM_API_KEY + meetingNumber + timestamp + role,
		).toString("base64");

		const hash = crypto
			.createHmac("sha256", ZOOM_API_SECRET)
			.update(msg)
			.digest("base64");

		const signature = Buffer.from(
			`${ZOOM_API_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`,
		).toString("base64");

		return {
			apiKey: ZOOM_API_KEY,
			signature,
		};
	}

	@Get("meeting/:meetingNumber/:passWord")
	renderMeeting(@Res() res: Response) {
		res.sendFile(path.resolve(__dirname, "../../assets/zoom/meeting.html"));
	}

	@Get("meeting.js")
	getMeetingScript(@Res() res: Response) {
		res.sendFile(path.resolve(__dirname, "../../assets/zoom/meeting.js"));
	}
}
