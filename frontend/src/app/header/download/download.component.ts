import { Component, OnInit } from "@angular/core";

@Component({
	selector: "app-download",
	templateUrl: "./download.component.html",
	styleUrls: ["./download.component.scss"],
})
export class DownloadComponent {
	os = null;

	constructor() {
		if (navigator.platform.indexOf("Win") != -1) this.os = "win";
		if (navigator.platform.indexOf("Mac") != -1) this.os = "mac";
	}
}
