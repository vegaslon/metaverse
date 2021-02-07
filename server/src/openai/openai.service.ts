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
		const tokens = JSON.parse(
			JSON.stringify(await this.openaiTokenModel.find({})),
		);

		for (const token of tokens) {
			if (token.monthly == null) token.monthly = {};

			token.totalCalls = Object.values(token.monthly).reduce(
				(calls, month: any) => calls + month.calls,
				0,
			);

			token.totalTokens = {};
			for (const month of Object.values<any>(token.monthly)) {
				for (const [engine, tokens] of Object.entries(month.tokens)) {
					if (token.totalTokens[engine] == null) {
						token.totalTokens[engine] = tokens;
					} else {
						token.totalTokens[engine] += tokens;
					}
				}
			}
		}

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

	updateDocTokensAndCalls(doc: OpenaiToken, tokens: number, engine: string) {
		engine = engine.toLowerCase().trim();

		const date = new Date();
		const monthKey =
			date.getFullYear() +
			"-" +
			String(date.getMonth() + 1).padStart(2, "0");

		if (doc.monthly[monthKey] == null) {
			doc.monthly[monthKey] = {
				calls: 1,
				tokens: { [engine]: tokens },
			};
		} else {
			doc.monthly[monthKey].calls++;
			if (doc.monthly[monthKey].tokens[engine] == null) {
				doc.monthly[monthKey].tokens[engine] = tokens;
			} else {
				doc.monthly[monthKey].tokens[engine] += tokens;
			}
		}

		doc.markModified("totalTokens");
		doc.markModified("monthly");

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

		if (apiRes.status < 400) {
			// num_tokens(prompt) + max_tokens * max(n, best_of)

			let promptEstTokens = 0;
			if (typeof body.prompt == "string") {
				promptEstTokens += body.prompt.length / 4;
			}

			let maxTokens = 0;
			if (Array.isArray(apiResJson.choices)) {
				for (const choice of apiResJson.choices) {
					if (typeof choice.text == "string") {
						maxTokens += choice.text.length / 4;
					}
				}
			}

			let n = 1; // default is 1
			if (typeof body.n == "number") n += body.n;

			let bestOf = 1; // default is 1
			if (typeof body.best_of == "number") n += body.best_of;

			const estTokens = promptEstTokens + maxTokens * Math.max(n, bestOf);

			// important!
			this.updateDocTokensAndCalls(doc, estTokens, engine);
		}

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

		if (apiRes.status < 400) {
			// Number of tokens in all of your documents
			// + (Number of documents + 1) * 14
			// + (Number of documents + 1) * Number of tokens in your query
			// = Total tokens

			let documentsEstTokens = 0;
			let documentsAmount = 0;
			if (Array.isArray(body.documents)) {
				for (const document of body.documents) {
					documentsAmount++;
					if (typeof document == "string") {
						documentsEstTokens += document.length / 4;
					}
				}
			}

			let queryEstTokens = 0;
			if (typeof body.query == "string") {
				queryEstTokens += body.query.length / 4;
			}

			let estTokens =
				documentsEstTokens +
				(documentsAmount + 1) * 14 +
				(documentsAmount + 1) * queryEstTokens;

			// important!
			this.updateDocTokensAndCalls(doc, estTokens, engine);
		}

		res.json(apiResJson);
	}
}
