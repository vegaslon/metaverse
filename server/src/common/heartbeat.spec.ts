import { heartbeat } from "./heartbeat";

jest.useFakeTimers();

describe("heartbeat", () => {
	it("should heart beat", () => {
		const sessions = {};

		const username = "Maki";
		interface User {
			cute: boolean;
		}

		heartbeat<User>(
			sessions,
			username,
			user => {
				user.cute = true;
			},
			() => {},
			1000 * 60, // ms
		);

		const wasOnceCute = sessions[username].cute;

		jest.advanceTimersByTime(1000 * 120);

		expect(sessions[username] == null && wasOnceCute).toBe(true);
	});
});
