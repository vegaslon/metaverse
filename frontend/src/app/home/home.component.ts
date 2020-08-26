import {
	Component,
	OnInit,
	ViewChild,
	ElementRef,
	OnDestroy,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { DownloadComponent } from "../header/download/download.component";
import { Subscription, interval } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { UtilsService } from "../utils.service";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
	@ViewChild("video", { static: true }) videoRef: ElementRef<
		HTMLVideoElement
	>;

	videoSub: Subscription;

	year = new Date().getFullYear();

	social = [
		["Discord", "https://tivolicloud.com/discord"],
		["Blog", "https://blog.tivolicloud.com"],
	];
	resources = [
		["Documentation", "https://docs.tivolicloud.com"],
		["JavaScript API", "https://apidocs.tivolicloud.com"],
	];
	contribute = [["GitLab", "https://git.tivolicloud.com"]];

	stats: { onlineUsers: number; onlineDomains: number } = null;

	constructor(
		public readonly dialog: MatDialog,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly http: HttpClient,
		public readonly utilsService: UtilsService,
	) {}

	ngOnInit() {
		this.route.url.subscribe(url => {
			if (url.length === 0) return;
			if (url[0].path !== "download") return;

			const dialog = this.dialog.open(DownloadComponent);
			dialog.afterClosed().subscribe(() => {
				this.router.navigateByUrl("/");
			});
		});

		const video = this.videoRef.nativeElement;

		const videoSub = interval(100).subscribe(() => {
			if (video.paused) {
				video
					.play()
					.then(() => {
						videoSub.unsubscribe();
					})
					.catch(err => {});
			} else {
				videoSub.unsubscribe();
			}
		});

		this.http
			.get<{ onlineUsers: number; onlineDomains: number }>(
				"/api/domains/stats",
			)
			.subscribe(stats => {
				this.stats = stats;
			});
	}

	ngOnDestroy() {
		if (this.videoSub) this.videoSub.unsubscribe();
	}
}
