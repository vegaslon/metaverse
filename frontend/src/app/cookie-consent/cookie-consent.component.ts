import { animate, style, transition, trigger } from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { environment } from "../../environments/environment";

@Component({
	selector: "app-cookie-consent",
	templateUrl: "./cookie-consent.component.html",
	styleUrls: ["./cookie-consent.component.scss"],
	animations: [
		trigger("close", [
			transition(":leave", [
				style({ opacity: 1 }),
				animate(
					"200ms cubic-bezier(0.4, 0.0, 0.2, 1)",
					style({ opacity: 0 }),
				),
			]),
		]),
	],
})
export class CookieConsentComponent implements OnInit {
	private readonly key = "cookieConsent";
	visible = false;

	constructor(private cookies: CookieService) {}

	ngOnInit() {
		if (this.cookies.get(this.key) === "") this.visible = true;
	}

	onConsent() {
		this.cookies.set(
			this.key,
			"true",
			365 * 100, // expires
			"/", // path
			null, // domain
			environment.production, // secure,
			"Lax",
		);
		this.visible = false;
	}
}
