import { JwtModule } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import * as fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Model, Mongoose, Schema } from "mongoose";
import * as path from "path";
import { Writable } from "stream";
import { AuthSignUpDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { generateRandomString } from "../common/utils";
import { Domain, DomainSchema } from "../domain/domain.schema";
import { DomainService } from "../domain/domain.service";
import { EmailModule } from "../email/email.module";
import { JWT_SECRET } from "../environment";
import {
	UserSession,
	UserSessionSchema,
	DomainSessionSchema,
} from "../session/session.schema";
import { SessionService } from "../session/session.service";
import { UserSettings, UserSettingsSchema } from "./user-settings.schema";
import { UserUpdateLocationDto } from "./user.dto";
import { User, UserSchema } from "./user.schema";
import { UserService } from "./user.service";
import { v4 as uuid } from "uuid";
import { MetricsService } from "../metrics/metrics.service";

// let mongo server download if it hasn't already
jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000 * 60 * 10;

jest.useFakeTimers();

describe("UserService", () => {
	let mongoServer: MongoMemoryServer;
	let mongoose: typeof import("mongoose");

	let domainModel: Model<Domain, {}>;
	let userModel: Model<User, {}>;
	let userSettingsModel: Model<UserSettings, {}>;
	let userSessionModel: Model<UserSession, {}>;
	let domainSessionModel: Model<UserSession, {}>;

	let userService: UserService;
	let sessionService: SessionService;

	beforeAll(async () => {
		mongoServer = new MongoMemoryServer();

		mongoose = new Mongoose({
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		await mongoose.connect(await mongoServer.getUri());

		const makeModel = (name: string, schema: Schema<any>): Model<any, {}> =>
			mongoose.model(name, schema, name);

		domainModel = makeModel("domains", DomainSchema);
		userModel = makeModel("users", UserSchema);
		userSettingsModel = makeModel("users.settings", UserSettingsSchema);
		userSessionModel = makeModel("users.sessions", UserSessionSchema);
		domainSessionModel = makeModel("domains.sessions", DomainSessionSchema);

		const module = await Test.createTestingModule({
			imports: [
				JwtModule.register({
					secret: JWT_SECRET,
					signOptions: {
						noTimestamp: true,
					},
				}),
				EmailModule,
			],
			providers: [
				{
					provide: getModelToken("domains"),
					useValue: domainModel,
				},
				{
					provide: getModelToken("users"),
					useValue: userModel,
				},
				{
					provide: getModelToken("users.settings"),
					useValue: userSettingsModel,
				},
				{
					provide: getModelToken("users.sessions"),
					useValue: userSessionModel,
				},
				{
					provide: getModelToken("domains.sessions"),
					useValue: domainSessionModel,
				},
				{
					provide: getConnectionToken(""),
					useValue: mongoose.connection,
				},
				{
					provide: MetricsService,
					useValue: {},
				},
				UserService,
				DomainService,
				AuthService,
				SessionService,
			],
		}).compile();

		userService = module.get<UserService>(UserService);
		userService.onModuleInit();

		sessionService = module.get<SessionService>(SessionService);
	});

	afterAll(async () => {
		//await mongoose.disconnect();
		//await mongoServer.stop();
	});

	const createUser = (email?: string, username?: string) => {
		const dto = new AuthSignUpDto();
		dto.email =
			email == null ? generateRandomString(6) + "@gmail.com" : email;
		dto.username = username == null ? generateRandomString(6) : username;

		return userService.createUser(dto, "password hash");
	};

	it("should create a new user and find it", async () => {
		const user = await createUser("maki@tivolicloud.com", "Maki");

		expect(
			(await userService.findByEmail("MAKI@tivolicloud.COM"))._id,
		).toEqual(user._id);
		expect((await userService.findById(user._id))._id).toEqual(user._id);
		expect((await userService.findByUsername("maki"))._id).toEqual(
			user._id,
		);
		expect((await userService.findByUsernameOrEmail("MAKI"))._id).toEqual(
			user._id,
		);
	});

	it("should change a users image and read it", async done => {
		const user = await createUser();

		await userService.changeUserImage(user, {
			fieldname: "image",
			originalname: "image.jpg",
			encoding: "",
			mimetype: "image/jpeg",
			buffer: fs.readFileSync(
				path.resolve(__dirname, "../../assets/user-image.jpg"),
			),
		});

		const userImage = await userService.getUserImage(String(user._id));

		// userImage.stream
		// 	.pipe(new Writable({ write: (chunk, enc, cb) => cb() }))
		// 	.on("finish", () => {
		// 		expect(userImage.stream).toBeTruthy();
		// 		expect(userImage.contentType).toBeTruthy();
		// 		done();
		// 	});

		expect(userImage.buffer).toBeTruthy();
		expect(userImage.contentType).toBeTruthy();
		done();
	});

	it("should return a user image that doesn't exist", async done => {
		const userImage = await userService.getUserImage("idontexist");

		// userImage.stream
		// 	.pipe(new Writable({ write: (chunk, enc, cb) => cb() }))
		// 	.on("finish", () => {
		// 		expect(userImage.stream).toBeTruthy();
		// 		expect(userImage.contentType).toBeTruthy();
		// 		done();
		// 	});

		expect(userImage.buffer).toBeTruthy();
		expect(userImage.contentType).toBeTruthy();
		done();
	});

	it("should heart beat a user, count more than a minute and die", async () => {
		const user = await createUser();

		expect(await sessionService.findUserById(user._id)).toBeNull();

		let secondsPassed = 0;
		const startDate = new Date();
		const advanceTime = (seconds: number) => {
			jest.advanceTimersByTime(1000 * seconds);
			jest.spyOn(Date, "now").mockImplementation(
				() => startDate.valueOf() + 1000 * secondsPassed,
			);
			secondsPassed += seconds;
		};

		await sessionService.heartbeatUser(user);
		expect(await sessionService.findUserById(user._id)).toBeDefined();

		// pass more than a minute
		for (let i = 0; i < 60; i++) {
			advanceTime(5);

			await sessionService.heartbeatUser(user);
			expect(await sessionService.findUserById(user._id)).toBeDefined();
		}

		expect(
			(await sessionService.findUserById(user._id)).minutes,
		).toBeGreaterThan(0);

		advanceTime(60);
		expect(await sessionService.findUserById(user._id)).toBeNull();
	});

	it("should set a users public key", async () => {
		const user = await createUser();

		expect(user.publicKey).toBe("");
		await userService.setPublicKey(
			user,
			Buffer.from(generateRandomString(128)),
		);

		expect((await userService.findById(user._id)).publicKey).toBeTruthy();
	});

	it("should set a users location twice", async () => {
		const user = await createUser();

		expect(await sessionService.findUserById(user._id)).toBeNull();

		const currentDomainId = uuid();

		const dto = new UserUpdateLocationDto();
		dto.location = {};
		dto.location.domain_id = currentDomainId;

		//await userService.setUserLocation(user, dto); // looks for domain session
		await sessionService.updateUserLocation(user, dto);

		const foundSession = await sessionService.findUserById(user._id);
		expect(foundSession.domain).toBe(currentDomainId); // not populated
	});

	// it("should get a users domain likes", async () => {
	// 	const user = await createUser();

	// 	const dto = new GetUserDomainsLikesDto();
	// 	dto.amount = 10;
	// 	dto.page = 1;
	// 	dto.search = "";

	// 	const likes = await userService.getDomainLikes(user, dto);
	// 	expect(likes.length).toBe(0);
	// });
});
