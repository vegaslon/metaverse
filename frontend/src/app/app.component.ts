import { isPlatformServer } from "@angular/common";
import { Component, Inject, OnInit, PLATFORM_ID } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { filter, take } from "rxjs/operators";
import { AuthService } from "./auth/auth.service";
import { SignInComponent } from "./header/sign-in/sign-in.component";

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
		let removeQuery = false;

		if (!query.has("token") && !query.has("signUp")) {
			this.authService.autoLogin(); // has window
		}

		if (query.has("hideHeader")) {
			this.showHeader = false;
			// removeQuery = true;
		}

		if (query.has("emailVerified")) {
			this.authService.openEmailVerifyDialog(true);
			removeQuery = true;
		}

		if (query.has("resetPassword")) {
			this.authService.openResetPasswordDialog(
				query.get("resetPassword"),
			);
			removeQuery = true;
		}

		if (query.has("token")) {
			this.authService.handleAuthentication({
				access_token: query.get("token"),
				created_at: 0,
				expires_in: 0,
				refresh_token: "",
				scope: "owner",
				token_type: "Bearer",
			});
			removeQuery = true;
		}

		if (query.has("signUp")) {
			this.dialog.open(SignInComponent, {
				data: {
					mode: "signUp",
				},
			});
			removeQuery = true;
		}

		if (query.has("signIn")) {
			this.dialog.open(SignInComponent, {
				data: {
					mode: "signIn",
				},
			});
			removeQuery = true;
		}

		if (query.has("launcherSignInPort")) {
			this.authService.loggingIn$
				.pipe(
					// only when logging is has finished
					filter(loggingIn => loggingIn == false),
					take(1),
				)
				.subscribe(() => {
					const user = this.authService.user$.getValue();
					const launcherSignInPort = parseInt(
						query.get("launcherSignInPort"),
					);

					if (user != null) {
						this.authService.launcherSignIn(launcherSignInPort);
					} else {
						// open sign in and wait for a user
						this.dialog.open(SignInComponent, {
							data: {
								mode: "signIn",
							},
						});
						this.authService.user$
							.pipe(
								filter(user => user != null),
								take(1),
							)
							.subscribe(user => {
								this.authService.launcherSignIn(
									launcherSignInPort,
								);
							});
					}
				});

			removeQuery = true;
		}

		if (query.has("forgotPassword")) {
			this.dialog.open(SignInComponent, {
				data: {
					mode: "resetPassword",
				},
			});
			removeQuery = true;
		}

		if (removeQuery) this.router.navigate([], { relativeTo: this.route });
	}
}
