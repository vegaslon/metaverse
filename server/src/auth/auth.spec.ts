import { JwtModule } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { JWT_SECRET } from "../environment";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
	let authService: AuthService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [
				JwtModule.register({
					secret: JWT_SECRET,
					signOptions: {
						noTimestamp: true,
					},
				}),
			],
			providers: [
				AuthService,
				{
					provide: UserService,
					useValue: {},
				},
			],
		}).compile();

		authService = module.get<AuthService>(AuthService);
	});

	it("should hash a password", async () => {
		const hash = await authService.hashPassword("password");
		expect(await bcrypt.compare("password", hash)).toBe(true);
	});
});
