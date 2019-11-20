export interface HeartbeatSession {
	_timer: NodeJS.Timer;
	_since: Date;
}

export function heartbeat<T>(
	sessions: {
		[s: string]: T & HeartbeatSession;
	},
	id: string,
	cleanup?: (s: T & HeartbeatSession) => Promise<void>,
	timeout: number = 1000 * 60,
): {
	isNew: boolean;
	session: T & HeartbeatSession;
} {
	const deleteSession = async () => {
		if (cleanup) await cleanup(sessions[id]);
		delete sessions[id];
	};

	if (sessions[id] != null) {
		const session = sessions[id];

		// reset timer
		clearTimeout(session._timer);
		session._timer = setTimeout(deleteSession, timeout);

		return {
			isNew: false,
			session,
		};
	} else {
		// create new session
		const session = ((sessions[id] as HeartbeatSession) = {
			_timer: setTimeout(deleteSession, timeout),
			_since: new Date(),
		}) as T & HeartbeatSession;

		return {
			isNew: true,
			session,
		};
	}
}

// export function testHeartbeating() {
// 	interface MySession {
// 		id: string;
// 		online: boolean;
// 	}

// 	let sessions = {};

// 	function handleHeartbeat() {
// 		let beat = heartbeat<MySession>(sessions, "Maki", 1000);
// 		if (beat.isNew) {
// 			const session = beat.session;

// 			session.id = new ObjectId().toHexString();
// 			session.online = true;
// 		}
// 		console.log(sessions);
// 	}

// 	let i = 0;
// 	let interval = setInterval(() => {
// 		handleHeartbeat();
// 		i++;

// 		if (i >= 6) {
// 			clearInterval(interval);
// 			setTimeout(() => {
// 				console.log(sessions);
// 				setTimeout(() => {
// 					handleHeartbeat();
// 				}, 2000);
// 			}, 2000);
// 		}
// 	}, 500);
// }
