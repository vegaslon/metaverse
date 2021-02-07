import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Response } from "express";
import { Model } from "mongoose";
import fetch from "node-fetch";
import { generateRandomString } from "../common/utils";
import { OPENAI_API_KEY } from "../environment";
import { OpenaiToken } from "./openai.schema";

@Injectable()
export class OpenaiService {
	constructor(
		@InjectModel("openai.tokens")
		private readonly openaiTokenModel: Model<OpenaiToken>,
	) {}

	async getDocFromToken(token: string) {
		const doc = await this.openaiTokenModel.findOne({ token });
		return doc;
	}

	async createToken(name: string) {
		const token = new this.openaiTokenModel({ name });
		await token.save();
	}

	async getTokens() {
		const tokens = await this.openaiTokenModel.find({});
		return tokens;
	}

	async deleteToken(id: string) {
		const token = await this.openaiTokenModel.findById(id);
		if (token == null) throw new NotFoundException("Token not found!");
		await token.remove();
	}

	async renameToken(id: string, name: string) {
		const token = await this.openaiTokenModel.findById(id);
		if (token == null) throw new NotFoundException("Token not found!");
		token.name = name;
		await token.save();
	}

	async refreshToken(id: string) {
		const token = await this.openaiTokenModel.findById(id);
		if (token == null) throw new NotFoundException("Token not found!");
		token.token = generateRandomString(32, true, true, true);
		await token.save();
	}

	updateDocEstTokensAndCalls(doc: OpenaiToken, estTokens: number) {
		doc.totalCalls++;
		doc.totalEstTokens += estTokens;

		const date = new Date();
		const monthKey =
			date.getFullYear() +
			"-" +
			String(date.getMonth() + 1).padStart(2, "0");

		const month = doc.monthly.get(monthKey);

		if (month == null) {
			doc.monthly.set(monthKey, {
				calls: 1,
				estTokens,
			});
		} else {
			doc.monthly.set(monthKey, {
				calls: month.calls + 1,
				estTokens: month.estTokens += estTokens,
			});
		}

		doc.save(); // dont need to await
	}

	async completions(token: string, engine: string, body: any, res: Response) {
		const doc = await this.getDocFromToken(token);
		if (doc == null) throw new BadRequestException("Invalid token");

		const apiRes = await fetch(
			"https://api.openai.com/v1/engines/" + engine + "/completions",
			{
				method: "POST",
				body: JSON.stringify(body),
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + OPENAI_API_KEY,
				},
			},
		);

		res.status(apiRes.status);
		const apiResJson = await apiRes.json();

		let estTokens = 0;
		if (typeof body.prompt == "string") {
			estTokens += body.prompt.length / 4;
		}
		if (Array.isArray(apiResJson.choices)) {
			for (const choice of apiResJson.choices) {
				if (typeof choice.text == "string") {
					estTokens += choice.text.length / 4;
				}
			}
		}

		// important!
		this.updateDocEstTokensAndCalls(doc, estTokens);

		res.json(apiResJson);
	}

	async search(token: string, engine: string, body: any, res: Response) {
		const doc = await this.getDocFromToken(token);
		if (doc == null) throw new BadRequestException("Invalid token");

		const apiRes = await fetch(
			"https://api.openai.com/v1/engines/" + engine + "/search",
			{
				method: "POST",
				body: JSON.stringify(body),
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + OPENAI_API_KEY,
				},
			},
		);

		res.status(apiRes.status);
		const apiResJson = await apiRes.json();

		let estTokens = 0;
		if (typeof body.query == "string") {
			estTokens += body.query.length / 4;
		}
		if (Array.isArray(body.documents)) {
			for (const document of body.documents) {
				if (typeof document == "string") {
					estTokens += document.length / 4;
				}
			}
		}

		// important!
		this.updateDocEstTokensAndCalls(doc, estTokens);

		res.json(apiResJson);
	}
}
