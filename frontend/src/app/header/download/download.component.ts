import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { map } from "rxjs/operators";
import { AmdComplicationsComponent } from "./amd-complications/amd-complications.component";

// type Platform = "windows" | "macos" | "linux";
type Platform = "windows" | "linux";

interface LauncherRelease {
	version: string;
	releaseDate: Date;
	platforms: Record<
		Platform,
		{
			url: string;
			filename: string;
			size: string;
			sha512: string;
		}
	>;
}

type InterfaceRelease = {
	version: string;
	date: Date;
} & Record<
	Platform,
	{
		filename: string;
		sha512: string;
		size: number;
	}
>;

@Component({
	selector: "app-download",
	templateUrl: "./download.component.html",
	styleUrls: ["./download.component.scss"],
})
export class DownloadComponent implements OnInit {
	// os: Platform = "windows";

	loaded = false;
	showExperimental = false;

	launcherRelease: LauncherRelease = null;
	interfaceRelease: InterfaceRelease = null;

	constructor(
		private readonly http: HttpClient,
		private readonly dialog: MatDialog,
	) {}

	ngOnInit() {
		// TODO: preload if on home component so download is more instant
		this.getLatest();
	}

	private bytesToMB(bytes: number) {
		return Math.floor(bytes / 1000 / 1000);
	}

	getLatest() {
		// if (navigator.platform.indexOf("Win") !== -1) this.os = "windows";
		// if (navigator.platform.indexOf("Mac") !== -1) this.os = "macos";

		this.http
			.get<LauncherRelease>("/api/releases/launcher/latest")
			.pipe(
				map(release => {
					release.releaseDate = new Date(release.releaseDate);
					for (const platform of Object.keys(release.platforms)) {
						release.platforms[platform].size =
							this.bytesToMB(release.platforms[platform].size) +
							" MB";
					}
					return release;
				}),
			)
			.subscribe(launcherRelease => {
				this.launcherRelease = launcherRelease;
				this.loaded = true;
			});

		this.http
			.get<InterfaceRelease>("/api/releases/interface/latest")
			.subscribe(interfaceRelease => {
				this.interfaceRelease = interfaceRelease;
			});
	}

	onAmdComplications() {
		this.dialog.open(AmdComplicationsComponent, {
			maxWidth: "75vw",
			maxHeight: "90vh",
		});
	}
}
