import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-download",
	templateUrl: "./download.component.html",
	styleUrls: ["./download.component.scss"],
})
export class DownloadComponent implements OnInit {
	readonly releasesPath = "https://cdn.tivolicloud.com/releases";

	//os = null;

	found = false;
	filename = "";
	filesize = "";

	constructor(private http: HttpClient) {}

	private bytesToMB(bytes: number) {
		return Math.floor(bytes / 1000 / 1000);
	}

	ngOnInit() {
		//if (navigator.platform.indexOf("Win") != -1) this.os = "win";
		//if (navigator.platform.indexOf("Mac") != -1) this.os = "mac";

		this.http
			.get(this.releasesPath + "/latest.yml", { responseType: "text" })
			.subscribe(
				ymlStr => {
					const matches = ymlStr.match(
						/files:[^]*?url: ([^]*?)\n[^]*?size: ([^]*?)\n/,
					);
					if (matches.length < 3) return;

					this.found = true;
					this.filename = matches[1];
					this.filesize =
						this.bytesToMB(parseInt(matches[2])) + " MB";
				},
				err => {},
			);
	}
}
