import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";

export interface VideoStreamHost {
	socket: Socket;
	clients: VideoStreamClient[];
}

export interface VideoStreamClient {
	socket: Socket;
	host: VideoStreamHost;
}

@Injectable()
export class VideoStreamService {
	hosts: VideoStreamHost[] = [];
	clients: VideoStreamClient[] = [];

	findHostById(id: string): VideoStreamHost {
		for (let host of this.hosts) {
			if (host.socket.client.id != id) continue;
			return host;
		}
		return null;
	}

	findClientById(id: string): VideoStreamClient {
		for (let client of this.clients) {
			if (client.socket.client.id != id) continue;
			return client;
		}
		return null;
	}

	addHost(socket: Socket): VideoStreamHost {
		const host = { socket, clients: [] } as VideoStreamHost;
		this.hosts.push(host);
		return host;
	}

	addClient(socket: Socket, host: VideoStreamHost) {
		const client = { socket, host };
		this.clients.push(client);
		host.clients.push(client);
		return client;
	}

	deleteFromArray(array: any[], item: any) {
		const i = array.indexOf(item);
		array.splice(i, 1);
	}

	deleteHost(host: VideoStreamHost) {
		for (let client of host.clients) {
			client.socket.disconnect();
			this.deleteFromArray(this.clients, client);
		}
		this.deleteFromArray(this.hosts, host);
	}

	deleteClient(client: VideoStreamClient) {
		this.deleteFromArray(client.host.clients, client);
		this.deleteFromArray(this.clients, client);
	}
}
