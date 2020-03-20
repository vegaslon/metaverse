import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-download",
	templateUrl: "./download.component.html",
	styleUrls: ["./download.component.scss"],
})
export class DownloadComponent implements OnInit {
	readonly releasesPath =
		"https://nyc3.digitaloceanspaces.com/tivolicloud/releases";

	//os = null;

	found = false;
	correctPassword = false;

	version: string;
	fileName: string;
	fileSize: string;
	releaseDate: Date;

	constructor(private http: HttpClient) {}

	private bytesToMB(bytes: number) {
		return Math.floor(bytes / 1000 / 1000);
	}

	getLatest() {
		//if (navigator.platform.indexOf("Win") != -1) this.os = "win";
		//if (navigator.platform.indexOf("Mac") != -1) this.os = "mac";

		this.http
			.get<{
				version: string;
				files: { url: string; sha512: string }[];
				path: string;
				sha512: string;
				packages: {
					x64: {
						size: number;
						sha512: string;
						blockMapSize: number;
						path: string;
						file: string;
					};
				};
				releaseDate: string;
			}>("/api/releases/latest")
			.subscribe(release => {
				this.version = release.version;

				this.fileName = release.path;

				this.fileSize =
					this.bytesToMB(release.packages.x64.size) + " MB";

				this.releaseDate = new Date(release.releaseDate);

				this.found = true;
			});
	}

	onPasswordKeyUp(input: HTMLInputElement) {
		if (
			input.value.replace(/ /g, "").toLowerCase() ==
			atob("aGFwcHlzcXVpcnJlbHM")
		) {
			this.getLatest();
			this.correctPassword = true;
		}
	}

	ngOnInit() {}
}
