import {
	Component,
	OnInit,
	ViewChild,
	ElementRef,
	OnDestroy,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { DownloadComponent } from "../header/download/download.component";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
	@ViewChild("video", { static: true }) videoEl: ElementRef;
	video: HTMLVideoElement;

	videoInterval: NodeJS.Timer;

	constructor(public dialog: MatDialog) {}

	ngOnInit() {
		this.video = this.videoEl.nativeElement;

		this.videoInterval = setInterval(() => {
			if (this.video.paused) this.video.play();
		}, 100);
	}

	ngOnDestroy() {
		clearInterval(this.videoInterval);
	}

	openDownload() {
		this.dialog.open(DownloadComponent);
	}
}
