import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router, ActivatedRoute } from "@angular/router";
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
		this.route.queryParams.subscribe(querys => {
			if (querys.noHeader != null) {
				this.showHeader = false;
			}
		});

		this.authService.autoLogin();
	}
}
