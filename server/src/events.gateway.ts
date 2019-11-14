import {
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

interface RTCSessionDescription {
	type: string;
	sdp: string;
}

interface Host {
	socket: Socket;
	clients: Client[];
}

interface Client {
	socket: Socket;
	host: Host;
}

@WebSocketGateway({
	namespace: "webrtc",
})
export class EventsGateway implements OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	hosts: Host[] = [];
	clients: Client[] = [];

	findHostById(id: string): Host {
		for (let host of this.hosts) {
			if (host.socket.client.id != id) continue;
			return host;
		}
		return null;
	}

	findClientById(id: string): Client {
		for (let client of this.clients) {
			if (client.socket.client.id != id) continue;
			return client;
		}
		return null;
	}

	deleteFromArray(array: any[], item: any) {
		const i = array.indexOf(item);
		array.splice(i, 1);
	}

	deleteHost(host: Host) {
		for (let client of host.clients) {
			client.socket.disconnect();
			this.deleteFromArray(this.clients, client);
		}
		this.deleteFromArray(this.hosts, host);
	}

	deleteClient(client: Client) {
		this.deleteFromArray(client.host.clients, client);
		this.deleteFromArray(this.clients, client);
	}

	@SubscribeMessage("host")
	newHost(socket: Socket): string {
		const id = socket.client.id;

		const host = this.findHostById(id);
		if (host == null) this.hosts.push({ socket, clients: [] });

		return id;
	}

	@SubscribeMessage("join")
	newClient(socket: Socket, hostId: string): boolean {
		const host = this.findHostById(hostId);
		if (host == null) return null;

		const id = socket.client.id;
		const client = this.findClientById(id);

		if (client == null) {
			const client = { socket, host };
			this.clients.push(client);
			host.clients.push(client);
			host.socket.emit("client", id);
		}

		return true;
	}

	@SubscribeMessage("iceCandidateToHost")
	iceCandidateToHost(socket: Socket, dto: { id: string; candidate: Object }) {
		const id = socket.client.id;

		const host = this.findHostById(dto.id);
		if (host == null) return null;

		host.socket.emit("iceCandidate", { id, candidate: dto.candidate });
		return true;
	}

	@SubscribeMessage("iceCandidateToClient")
	iceCandidateToClient(
		socket: Socket,
		dto: { id: string; candidate: Object },
	) {
		const id = socket.client.id;

		const client = this.findClientById(dto.id);
		if (client == null) return null;

		client.socket.emit("iceCandidate", { id, candidate: dto.candidate });
		return true;
	}

	@SubscribeMessage("offerToClient")
	offerToClient(
		socket: Socket,
		dto: { id: string; offer: RTCSessionDescription },
	) {
		const id = socket.client.id;

		const client = this.findClientById(dto.id);
		if (client == null) return null;

		client.socket.emit("offer", { id, offer: dto.offer });
		return true;
	}

	@SubscribeMessage("answerToHost")
	answerToHost(
		socket: Socket,
		dto: { id: string; answer: RTCSessionDescription },
	) {
		const id = socket.client.id;

		const host = this.findHostById(dto.id);
		if (host == null) return null;

		host.socket.emit("answer", { id, answer: dto.answer });
		return true;
	}

	handleDisconnect(socket: Socket) {
		const id = socket.client.id;

		const host = this.findHostById(id);
		if (host != null) return this.deleteHost(host);

		const client = this.findClientById(id);
		if (client != null) {
			client.host.socket.emit("clientDisconnect", id);
			this.deleteClient(client);
			return;
		}
	}
}
