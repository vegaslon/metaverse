export interface HeartbeatSession {
	_timer: NodeJS.Timer;
	_since: Date;
}

export function heartbeat<T>(
	sessions: Map<string, T & HeartbeatSession>,
	id: string,
	init?: (s: T & HeartbeatSession) => any,
	cleanup?: (s: T & HeartbeatSession) => any,
	timeout: number = 1000 * 60,
): T & HeartbeatSession {
	const destroy = () => {
		if (cleanup) cleanup(sessions.get(id));
		sessions.delete(id);
	};

	const session = sessions.get(id);

	if (session == null) {
		// create new session
		const session = {
			_timer: setTimeout(() => {
				destroy();
			}, timeout),
			_since: new Date(),
		} as T & HeartbeatSession;

		sessions.set(id, session);
		if (init) init(session);

		return session;
	} else {
		// reset timer back to timeout
		clearTimeout(session._timer);

		session._timer = setTimeout(() => {
			destroy();
		}, timeout);

		return session;
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
