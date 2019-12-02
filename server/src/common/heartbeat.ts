export interface HeartbeatSession {
	_timer: NodeJS.Timer;
	_since: Date;
}

export function heartbeat<T>(
	sessions: {
		[s: string]: T & HeartbeatSession;
	},
	id: string,
	init?: (s: T & HeartbeatSession) => any,
	cleanup?: (s: T & HeartbeatSession) => any,
	timeout: number = 1000 * 60,
): T & HeartbeatSession {
	if (!/-/.test(id)) {
		console.log(
			"heartbeating: " + id + ", new session: " + (sessions[id] == null),
		);
		console.log(sessions);
	}

	if (sessions[id] == null) {
		// create new session
		if (sessions[id] == null) {
			(sessions[id] as HeartbeatSession) = {
				_timer: setTimeout(() => {
					if (cleanup) cleanup(sessions[id]);
					delete sessions[id];
				}, timeout),
				_since: new Date(),
			};

			if (init) init(sessions[id]);
		}

		return sessions[id];
	} else if (sessions[id] != null) {
		// reset timer back to timeout
		const oldTimer = sessions[id]._timer;
		clearTimeout(oldTimer);

		sessions[id]._timer = setTimeout(() => {
			if (cleanup) cleanup(sessions[id]);
			delete sessions[id];
		}, timeout);

		return sessions[id];
	} else {
		return sessions[id];
	}
}

// export function testHeartbeating() {
// 	interface MySession {
// 		id: number;
// 		online: boolean;
// 	}

// 	let sessions = {};

// 	function handleHeartbeat() {
// 		heartbeat<MySession>(
// 			sessions,
// 			"Maki",
// 			session => {
// 				session.id = Math.floor(Math.random() * 100);
// 				session.online = true;
// 			},
// 			null,
// 			100,
// 		);

// 		console.log(sessions);
// 	}

// 	let i = 0;
// 	let interval = setInterval(() => {
// 		handleHeartbeat();
// 		i++;

// 		if (i >= 50) {
// 			clearInterval(interval);
// 			setTimeout(() => {
// 				console.log(sessions);
// 				setTimeout(() => {
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 					handleHeartbeat();
// 				}, 200);
// 			}, 200);
// 		}
// 	}, 50);
// }
// testHeartbeating();
