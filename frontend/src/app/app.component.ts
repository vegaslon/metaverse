import { Component, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { AuthService } from "./auth/auth.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html",
})
export class AppComponent implements OnInit {
	public showHeader = true;

	constructor(private authService: AuthService, private router: Router) {}

	ngOnInit() {
		this.router.events.subscribe(val => {
			if (!(val instanceof NavigationEnd)) return;

			if (val.url.startsWith("/stream/")) {
				this.showHeader = false;
			} else {
				this.showHeader = true;
			}
		});

		this.authService.autoLogin();
	}
}
