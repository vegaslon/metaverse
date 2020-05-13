import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
	selector: "app-sso-redirecting",
	templateUrl: "./sso-redirecting.component.html",
})
export class SsoRedirectingComponent {
	constructor(
		@Inject(MAT_DIALOG_DATA)
		public data: {
			name: string;
			// extra: string;
		},
	) {}
}
