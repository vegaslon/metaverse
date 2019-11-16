import * as io from "socket.io-client";
import { BehaviorSubject } from "rxjs";

export class WebRTCClient {
	host: string;
	socket: SocketIOClient.Socket = null;

	conn: RTCPeerConnection;

	stream = new BehaviorSubject<MediaStream>(null);

	log(message: any) {
		//console.log(message);
	}

	sendIceCandidate(id: string, e: RTCPeerConnectionIceEvent) {
		const { candidate } = e;

		if (candidate == null) return this.log("ice gathering finished!");

		this.log("sending ice candidate to " + id);
		this.socket.emit("iceCandidateToHost", { id, candidate });
	}

	onTrack = (e: RTCTrackEvent) => {
		this.log("Got track!");
		this.log(e);

		if (e.streams.length > 0) this.stream.next(e.streams[0]);

		// const video: HTMLVideoElement = document.createElement("video");
		// video.controls = true;
		// video.autoplay = true;
		// video.srcObject = e.streams[0];

		// document.body.appendChild(video);
	};

	receiveIceCandidate(dto: { id: string; candidate: RTCIceCandidate }) {
		const { id, candidate } = dto;
		this.log("received ice candidate from " + id);

		if (this.conn == null) return;
		this.conn.addIceCandidate(candidate);
	}

	async receiveOffer(dto: { id: string; offer: RTCSessionDescription }) {
		const { id, offer } = dto;
		this.log("received offer from " + id);

		if (this.conn == null) return;

		this.conn.setRemoteDescription(offer);
		const answer = await this.conn.createAnswer();
		this.conn.setLocalDescription(answer);

		this.log("sending answer to " + id);
		this.socket.emit("answerToHost", { id, answer });
	}

	constructor(id: string) {
		this.host = id;

		this.conn = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		this.conn.addEventListener("icecandidate", e => {
			this.sendIceCandidate(this.host, e);
		});

		this.conn.addEventListener("track", this.onTrack);

		this.socket = io("https://alpha.tivolicloud.com/webrtc");

		this.socket.once("connect", () => {
			this.socket.on("iceCandidate", dto => {
				this.receiveIceCandidate(dto);
			});
			this.socket.on("offer", dto => {
				this.receiveOffer(dto);
			});

			this.socket.emit("join", this.host);
		});

		(window as any).test = this.socket;
	}
}
