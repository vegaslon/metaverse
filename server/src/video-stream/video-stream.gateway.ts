import {
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
	VideoStreamService,
	VideoStreamHost,
	VideoStreamClient,
} from "./video-stream.service";

interface RTCSessionDescription {
	type: string;
	sdp: string;
}

@WebSocketGateway({
	namespace: "webrtc",
})
export class VideoStreamGateway implements OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	constructor(private service: VideoStreamService) {}

	@SubscribeMessage("host")
	newHost(socket: Socket): string {
		const id = socket.client.id;

		const host = this.service.findHostById(id);
		if (host == null) this.service.addHost(socket);

		return id;
	}

	@SubscribeMessage("join")
	newClient(socket: Socket, hostId: string): boolean {
		const host = this.service.findHostById(hostId);
		if (host == null) return null;

		const id = socket.client.id;
		const client = this.service.findClientById(id);

		if (client == null) {
			const client = this.service.addClient(socket, host);
			host.clients.push(client);
			host.socket.emit("client", id);
		}

		return true;
	}

	@SubscribeMessage("iceCandidateToHost")
	iceCandidateToHost(socket: Socket, dto: { id: string; candidate: Object }) {
		const id = socket.client.id;

		const host = this.service.findHostById(dto.id);
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

		const client = this.service.findClientById(dto.id);
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

		const client = this.service.findClientById(dto.id);
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

		const host = this.service.findHostById(dto.id);
		if (host == null) return null;

		host.socket.emit("answer", { id, answer: dto.answer });
		return true;
	}

	handleDisconnect(socket: Socket) {
		const id = socket.client.id;

		const host = this.service.findHostById(id);
		if (host != null) return this.service.deleteHost(host);

		const client = this.service.findClientById(id);
		if (client != null) {
			client.host.socket.emit("clientDisconnected", id);
			this.service.deleteClient(client);
			return;
		}
	}
}
