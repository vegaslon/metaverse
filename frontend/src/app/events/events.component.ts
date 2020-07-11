import { Component, OnInit, Inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
	selector: "app-events",
	templateUrl: "./events.component.html",
	styleUrls: ["./events.component.scss"],
})
export class EventsComponent implements OnInit {
	private readonly baseUrl =
		"https://calendar.google.com/calendar/embed?wkst=2&bgcolor=%23ffffff&src=ZW1vYjR1ZnE4MGs2dDZlNTE1bnU5cWV2NWNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&color=%23D81B60&showTitle=0&showNav=0&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=1&mode=MONTH";

	url = this.baseUrl;

	constructor(
		@Inject(PLATFORM_ID) private readonly platformId: string,
		public readonly sanitizer: DomSanitizer,
	) {}

	ngOnInit(): void {
		if (isPlatformBrowser(this.platformId) && window.Intl) {
			const timeZone = new window.Intl.DateTimeFormat().resolvedOptions()
				.timeZone;

			console.log("Detected time zone: " + timeZone);

			this.url = this.baseUrl + "&ctz=" + encodeURIComponent(timeZone);
		}
	}
}
