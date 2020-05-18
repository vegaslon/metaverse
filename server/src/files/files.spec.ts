import { Test } from "@nestjs/testing";
import { MetricsService } from "../metrics/metrics.service";
import { User } from "../user/user.schema";
import { FilesService } from "./files.service";

describe("FilesService", () => {
	let filesService: FilesService;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [],
			providers: [
				FilesService,
				{
					provide: MetricsService,
					useValue: {},
				},
			],
		}).compile();

		filesService = module.get<FilesService>(FilesService);
	});

	it("should error on invalid paths", () => {
		const user: User = {
			id: "userId",
		} as any;

		expect(() =>
			// @ts-ignore
			filesService.validatePath(user, "../anotherId/folder/file.txt"),
		).toThrow();
		expect(() =>
			// @ts-ignore
			filesService.validatePath(user, "/../anotherId/folder/file.txt"),
		).toThrow();
		expect(() =>
			// @ts-ignore
			filesService.validatePath(user, "/../anotherId/folder", true),
		).toThrow();
	});
});
