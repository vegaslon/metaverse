import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "./auth/auth.service";
import { MatDialog } from "@angular/material/dialog";
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
	) {}

	ngOnInit() {
		const query = new URLSearchParams(window.location.search);

		let isQuery = false;
		let autoLogin = true;

		if (query.get("noHeader") != null) {
			isQuery = true;
			this.showHeader = false;
		}

		if (query.get("emailVerified") != null) {
			isQuery = true;
			this.authService.openEmailVerifyDialog(true);
		}

		if (query.get("token") != null) {
			isQuery = true;
			autoLogin = false;

			this.authService.handleAuthentication({
				access_token: query.get("token"),
				created_at: 0,
				expires_in: 0,
				refresh_token: "",
				scope: "owner",
				token_type: "Bearer",
			});
		}

		if (query.get("signUp") != null) {
			isQuery = true;
			autoLogin = false;

			this.dialog.open(SignInComponent, {
				width: "400px",
				data: {
					mode: "signUp",
				},
			});
		}

		if (isQuery) this.router.navigate(["."], { relativeTo: this.route });
		if (autoLogin) this.authService.autoLogin();
	}
}
