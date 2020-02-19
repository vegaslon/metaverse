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
	version: string;
	fileName: string;
	fileSize: string;
	releaseDate: Date;

	constructor(private http: HttpClient) {}

	private bytesToMB(bytes: number) {
		return Math.floor(bytes / 1000 / 1000);
	}

	ngOnInit() {
		//if (navigator.platform.indexOf("Win") != -1) this.os = "win";
		//if (navigator.platform.indexOf("Mac") != -1) this.os = "mac";

		const sub = this.http
			.get(this.releasesPath + "/latest.yml", { responseType: "text" })
			.subscribe(
				ymlStr => {
					this.version = ymlStr.match(/version: ([^]*?)\n/i)[1];

					const matches = ymlStr.match(
						/files:[^]*?url: ([^]*?)\n[^]*?size: ([^]*?)\n/,
					);
					this.fileName = matches[1];
					this.fileSize =
						this.bytesToMB(parseInt(matches[2])) + " MB";

					this.releaseDate = new Date(
						ymlStr.match(/releaseDate: '([^]*?)'/i)[1],
					);

					this.found = true;
					sub.unsubscribe();
				},
				err => {
					sub.unsubscribe();
				},
			);
	}
}
