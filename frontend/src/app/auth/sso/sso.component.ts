import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { SsoRedirectingComponent } from "./sso-redirecting/sso-redirecting.component";
import { HttpClient } from "@angular/common/http";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { switchMap, map } from "rxjs/operators";

@Component({
	selector: "app-sso",
	template: "",
})
export class SsoComponent implements OnInit {
	constructor(
		private dialog: MatDialog,
		private http: HttpClient,
		private router: Router,
		private route: ActivatedRoute,
	) {}

	private readonly services = ["gitlab"];

	ngOnInit() {
		this.route.paramMap.pipe().subscribe(params => {
			const service = params.get("service").toLowerCase();

			if (!this.services.includes(service))
				return this.router.navigateByUrl("/");

			// just gitlab for now

			this.router.navigateByUrl("/"); // better than a white background

			const dialog = this.dialog.open(SsoRedirectingComponent, {
				disableClose: true,
			});

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
		});
	}
}
