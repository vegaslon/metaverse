import {
	BadRequestException,
	Injectable,
	NotFoundException,
	OnModuleDestroy,
	OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as childProcess from "child_process";
import { Response } from "express";
import { Model } from "mongoose";
import fetch from "node-fetch";
import * as path from "path";
import { generateRandomString } from "../common/utils";
import { DEV, OPENAI_API_KEY } from "../environment";
import { OpenaiToken } from "./openai.schema";

class Tokenizer {
	readonly port = "57916";
	readonly process: childProcess.ChildProcess;

	readonly dontSpawnProcess = DEV;

	constructor() {
		if (!this.dontSpawnProcess) {
			// this may conflict when pm2 starts multiple node servers on the
			// same machine. however it seems that the python server will just
			// freeze forever and only the first one responds to requests.
			// TODO: the process should probably close then because memory
			this.process = childProcess.spawn(
				// TODO: use which (on windows too) to figure out the executable
				"python3",
				[
					path.resolve(__dirname, "../../assets/tokenizer-server.py"),
					this.port,
				],
				{ detached: false },
			);
		}
	}

	destroy() {
		this.process.kill("SIGKILL");
	}

	async numTokensSimple(message: string) {
		return message.length / 4;
	}

	async numTokens(message: string, retries = 0) {
		if (this.dontSpawnProcess) {
			return this.numTokensSimple(message);
		}
		try {
			const res = await fetch("http://127.0.0.1:" + this.port, {
				method: "POST",
				body: JSON.stringify({ message }),
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json();
			return data.tokens;
		} catch (err) {
			if (retries > 5) {
				return this.numTokensSimple(message);
			} else {
				// console.log("retrying... (" + retries + ")");
				await new Promise(resolve => {
					setTimeout(() => {
						resolve(null);
					}, 1000);
				});
				return this.numTokens(message, retries + 1);
			}
		}
	}
}

@Injectable()
export class OpenaiService implements OnModuleInit, OnModuleDestroy {
	tokenizer: Tokenizer;

	constructor(
		@InjectModel("openai.tokens")
		private readonly openaiTokenModel: Model<OpenaiToken>,
	) {}

	onModuleInit() {
		this.tokenizer = new Tokenizer();
	}

	onModuleDestroy() {
		this.tokenizer.destroy();
	}

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
			(async () => {
				// num_tokens(prompt) + max_tokens * max(n, best_of)

				let promptTokens = 0;
				if (typeof body.prompt == "string") {
					promptTokens += await this.tokenizer.numTokens(body.prompt);
				}

				let maxTokens = 0;
				if (Array.isArray(apiResJson.choices)) {
					for (const choice of apiResJson.choices) {
						if (typeof choice.text == "string") {
							maxTokens += await this.tokenizer.numTokens(
								choice.text,
							);
						}
					}
				}

				let n = 1; // default is 1
				if (typeof body.n == "number") n += body.n;

				let bestOf = 1; // default is 1
				if (typeof body.best_of == "number") n += body.best_of;

				const tokens = promptTokens + maxTokens * Math.max(n, bestOf);

				// important!
				this.updateDocTokensAndCalls(doc, tokens, engine);
			})();
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
			(async () => {
				// Number of tokens in all of your documents
				// + (Number of documents + 1) * 14
				// + (Number of documents + 1) * Number of tokens in your query
				// = Total tokens

				let documentsTokens = 0;
				let documentsAmount = 0;
				if (Array.isArray(body.documents)) {
					for (const document of body.documents) {
						documentsAmount++;
						if (typeof document == "string") {
							documentsTokens += await this.tokenizer.numTokens(
								document,
							);
						}
					}
				}

				let queryTokens = 0;
				if (typeof body.query == "string") {
					queryTokens += await this.tokenizer.numTokens(body.query);
				}

				let tokens =
					documentsTokens +
					(documentsAmount + 1) * 14 +
					(documentsAmount + 1) * queryTokens;

				// important!
				this.updateDocTokensAndCalls(doc, tokens, engine);
			})();
		}

		res.json(apiResJson);
	}
}
