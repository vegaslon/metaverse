import { VideoStreamService } from "./video-stream.service";

describe("videoStreamService", () => {
	let videoStreamService: VideoStreamService;

	beforeEach(() => {
		videoStreamService = new VideoStreamService();
	});

	it("should add a host then find it", () => {
		const host = videoStreamService.addHost({
			client: { id: "Maki" },
		} as any);

		expect(videoStreamService.findHostById("Maki")).toBe(host);
	});

	it("should add a host and client then find it", () => {
		const host = videoStreamService.addHost({
			client: { id: "Maki" },
		} as any);

		const client = videoStreamService.addClient(
			{
				client: { id: "Caitlyn" },
			} as any,
			host,
		);

		const foundClient = videoStreamService.findClientById("Caitlyn");
		const foundHost = foundClient.host;

		expect(foundClient == client && foundHost == host).toBe(true);
	});

	it("should add a host then delete it", () => {
		const host = videoStreamService.addHost({
			client: { id: "Maki" },
		} as any);

		videoStreamService.deleteHost(host);

		expect(videoStreamService.findHostById("Maki")).toBe(null);
	});

	it("should add a host and client then delete the client", () => {
		const host = videoStreamService.addHost({
			client: { id: "Maki" },
		} as any);

		const client = videoStreamService.addClient(
			{
				client: { id: "Caitlyn" },
			} as any,
			host,
		);

		videoStreamService.deleteClient(client);

		expect(videoStreamService.findHostById("Maki").clients.length).toBe(0);
	});

	it("should add a host and client then delete the host", () => {
		const host = videoStreamService.addHost({
			client: { id: "Maki" },
		} as any);

		const client = videoStreamService.addClient(
			{
				client: { id: "Caitlyn" },
			} as any,
			host,
		);

		videoStreamService.deleteHost(host);

		expect(
			videoStreamService.findClientById("Maki") == null &&
				videoStreamService.findHostById("Caitlyn") == null,
		).toBe(true);
	});
});
