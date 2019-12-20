import { heartbeat } from "./heartbeat";

jest.useFakeTimers();

describe("heartbeat", () => {
	let sessions = {};

	const username = "Maki";
	interface User {
		cute: boolean;
	}

	beforeEach(() => {
		sessions = {};
	});

	it("should heart beat once and die", () => {
		heartbeat<User>(
			sessions,
			username,
			user => {
				user.cute = true;
			},
			() => {},
			1000,
		);

		const wasOnceCute = sessions[username].cute;
		jest.advanceTimersByTime(2000);
		expect(sessions[username] == null && wasOnceCute).toBe(true);
	});

	it("should heart beat a couple of times and die", () => {
		const beat = () => {
			heartbeat<User>(
				sessions,
				username,
				user => {
					user.cute = true;
				},
				() => {},
				1000,
			);
		};

		beat();
		jest.advanceTimersByTime(500);
		beat();
		jest.advanceTimersByTime(500);

		const wasOnceCute = sessions[username].cute;
		jest.advanceTimersByTime(1500);
		expect(sessions[username] == null && wasOnceCute).toBe(true);
	});
});
