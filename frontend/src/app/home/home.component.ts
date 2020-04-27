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

	constructor(
		public dialog: MatDialog,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
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
	}

	ngOnDestroy() {
		if (this.videoSub) this.videoSub.unsubscribe();
	}
}
