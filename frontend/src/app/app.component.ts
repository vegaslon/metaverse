import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "./auth/auth.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html",
})
export class AppComponent implements OnInit {
	public showHeader = true;

	constructor(
		private authService: AuthService,
		private router: Router,
		private route: ActivatedRoute,
	) {}

	ngOnInit() {
		this.route.queryParams.subscribe(query => {
			if (query.noHeader != null) {
				this.showHeader = false;
			}
			if (query.emailVerified != null) {
				this.authService.openEmailVerifyDialog(true);
			}
			if (Object.keys(query).length > 0)
				this.router.navigate(["."], { relativeTo: this.route });
		});

		this.authService.autoLogin();
	}
}
