import { Component, OnInit, Inject, PLATFORM_ID } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "./auth/auth.service";
import { SignInComponent } from "./header/sign-in/sign-in.component";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html",
})
export class AppComponent implements OnInit {
	showHeader = true;

	constructor(
		private authService: AuthService,
		private router: Router,
		private route: ActivatedRoute,
		private dialog: MatDialog,
		@Inject(PLATFORM_ID) private platformId: Object,
	) {}

	ngOnInit() {
		// goatcounter
		// const w = window as any;
		// let referrer = "";
		// this.router.events.subscribe(val => {
		// 	if (!(val instanceof NavigationEnd)) return;

		// 	if (w.goatcounter != null) w.goatcounter.count({ referrer });
		// 	referrer = window.location.href;
		// });

		if (isPlatformServer(this.platformId)) return; // ssr has no window

		const query = new URLSearchParams(window.location.search);

		if (query.has("noHeader")) this.showHeader = false;

		if (query.has("emailVerified"))
			this.authService.openEmailVerifyDialog(true);

		if (query.has("token")) {
			this.authService.handleAuthentication({
				access_token: query.get("token"),
				created_at: 0,
				expires_in: 0,
				refresh_token: "",
				scope: "owner",
				token_type: "Bearer",
			});
		}

		if (query.has("signUp")) {
			this.dialog.open(SignInComponent, {
				width: "400px",
				data: {
					mode: "signUp",
				},
			});
		}

		// remove from url
		if (query.toString().length > 0)
			this.router.navigate(["."], { relativeTo: this.route });
	}
}
