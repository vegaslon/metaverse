import { Component, OnInit, PLATFORM_ID, Inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { SsoRedirectingComponent } from "./sso-redirecting/sso-redirecting.component";
import { HttpClient } from "@angular/common/http";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { switchMap, map } from "rxjs/operators";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { AuthService } from "../auth.service";

@Component({
	selector: "app-sso",
	template: "",
})
export class SsoComponent implements OnInit {
	constructor(
		private readonly dialog: MatDialog,
		private readonly http: HttpClient,
		private readonly router: Router,
		private readonly route: ActivatedRoute,
		private readonly authService: AuthService,
		@Inject(PLATFORM_ID) private platformId: Object,
	) {}

	private readonly services = ["gitlab", "fider"];

	ngOnInit() {
		if (isPlatformServer(this.platformId)) return;

		this.route.paramMap.subscribe(params => {
			const service = params.get("service").toLowerCase();

			if (!this.services.includes(service))
				return this.router.navigateByUrl("/");

			// better than a white background which doesn't seem to work anymore
			this.router.navigateByUrl("/");

			const dialog = this.dialog.open(SsoRedirectingComponent, {
				disableClose: true,
			});

			if (service === "gitlab") {
				this.http
					.post("/api/auth/sso/gitlab", null, {
						responseType: "text",
					})
					.subscribe(
						token => {
							window.location.href =
								"https://git.tivolicloud.com/users/auth/jwt/callback?jwt=" +
								token;
						},
						err => {
							console.log(err);
							dialog.close();
						},
					);
			} else if (service === "fider") {
				// not sso. it's badly implemented oauth
				this.route.queryParams.subscribe(query => {
					const { client_id, redirect_uri, state } = query;
					if (client_id !== "fider") return dialog.close();
					if (redirect_uri == null) return dialog.close();
					if (state == null) return dialog.close();
					if (
						redirect_uri
							.toLowerCase()
							.startsWith("https://roadmap.tivolicloud.com") ===
						false
					)
						return dialog.close();

					const sub = this.authService.user$.subscribe(user => {
						if (user == null) return;

						const redirect = new URL(redirect_uri);
						redirect.searchParams.set(
							"code",
							user.token.access_token,
						);
						redirect.searchParams.set("state", state);
						window.location.href = redirect.href;

						sub.unsubscribe();
					});
				});
			}
		});
	}
}
