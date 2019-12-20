import { VideoStreamService } from "./video-stream.service";

describe("videoStreamService", () => {
	let videoStreamService: VideoStreamService;

	const newSocket = (id: string) => {
		return {
			client: {
				id,
			},
			disconnect: () => {},
		} as SocketIO.Socket;
	};

	beforeEach(() => {
		videoStreamService = new VideoStreamService();
	});

	it("should add some hosts then find one", () => {
		videoStreamService.addHost(newSocket("NotMaki"));
		const host = videoStreamService.addHost(newSocket("Maki"));

		expect(videoStreamService.findHostById("Maki")).toBe(host);
	});

	it("should add some hosts and clients then find one client", () => {
		videoStreamService.addHost(newSocket("NotMaki"));
		const host = videoStreamService.addHost(newSocket("Maki"));

		videoStreamService.addClient(newSocket("NotCaitlyn"), host);
		const client = videoStreamService.addClient(newSocket("Caitlyn"), host);

		const foundClient = videoStreamService.findClientById("Caitlyn");
		const foundHost = foundClient.host;

		expect(foundClient == client && foundHost == host).toBe(true);
	});

	it("should add a host then delete it", () => {
		const host = videoStreamService.addHost(newSocket("Maki"));
		videoStreamService.deleteHost(host);

		expect(videoStreamService.findHostById("Maki")).toBe(null);
	});

	it("should add a host and client then delete the client", () => {
		const host = videoStreamService.addHost(newSocket("Maki"));
		const client = videoStreamService.addClient(newSocket("Caitlyn"), host);
		videoStreamService.deleteClient(client);

		expect(videoStreamService.findHostById("Maki").clients.length).toBe(0);
	});

	it("should add a host and client then delete the host", () => {
		const host = videoStreamService.addHost(newSocket("Maki"));
		videoStreamService.addClient(newSocket("Caitlyn"), host);
		videoStreamService.deleteHost(host);

		expect(
			videoStreamService.findClientById("Maki") == null &&
				videoStreamService.findHostById("Caitlyn") == null,
		).toBe(true);
	});
});
