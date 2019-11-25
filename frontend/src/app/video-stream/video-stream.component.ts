import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { WebRTCClient } from "./libs/webrtcClient";

@Component({
	selector: "app-video-stream",
	templateUrl: "./video-stream.component.html",
	styleUrls: ["./video-stream.component.scss"],
})
export class VideoStreamComponent implements OnInit {
	client: WebRTCClient = null;
	stream: MediaStream = null;

	@ViewChild("video", { static: false }) video: ElementRef;

	constructor(private router: Router, private route: ActivatedRoute) {
		this.router.navigate([], {
			relativeTo: route,
			queryParams: { noHeader: true } as Params,
			queryParamsHandling: "merge",
		});
	}

	getID(): Promise<string> {
		return new Promise((resolve, reject) => {
			const sub = this.route.params.subscribe(
				params => {
					if (!params.id) return reject();
					return resolve(params.id);
				},
				err => {
					return reject();
				},
				() => {
					sub.unsubscribe();
				},
			);
		});
	}

	async ngOnInit() {
		const id = await this.getID();

		const videoEl = this.video.nativeElement as HTMLVideoElement;
		videoEl.addEventListener("canplay", () => {
			videoEl.play();
		});

		this.client = new WebRTCClient(id);
		this.client.stream.subscribe(stream => {
			this.stream = stream;
			videoEl.play();
		});
	}
}
