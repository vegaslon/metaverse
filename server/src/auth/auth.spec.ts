import { JwtModule, JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { JWT_SECRET } from "../environment";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
	let authService: AuthService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			imports: [
				JwtModule.register({
					secret: JWT_SECRET,
					signOptions: {
						noTimestamp: true,
					},
				}),
			],
		}).compile();

		authService = new AuthService(
			{} as UserService,
			module.get<JwtService>(JwtService),
		);
	});

	it("should hash a password", async () => {
		const hash = await authService.hashPassword("password");
		expect(await bcrypt.compare("password", hash)).toBe(true);
	});
});
