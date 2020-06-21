import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { AdminUser, AdminService } from "../admin.service";
import { AuthService } from "../../auth/auth.service";

@Component({
	selector: "app-user",
	templateUrl: "./user.component.html",
	styleUrls: ["./user.component.scss"],
})
export class UserComponent implements OnInit {
	user: AdminUser = null;

	constructor(
		private readonly route: ActivatedRoute,
		private readonly adminService: AdminService,
		private readonly authService: AuthService,
	) {}

	refreshUser(username?: string) {
		if (username == null && this.user != null)
			username = this.user.username;

		this.adminService.getUser(username).subscribe(user => {
			this.user = user;
		});
	}

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			const username = params.username;
			if (username == null) return (this.user = null);
			this.refreshUser(username);
		});
	}

	onImpersonate() {
		this.authService.impersonateUser(this.user);
	}

	onToggleVerify() {
		if (window.confirm("Are you sure you want to toggle verified?"))
			this.adminService.toggleVerifyUser(this.user.id).subscribe(() => {
				this.refreshUser();
			});
	}

	onToggleAdmin() {
		if (
			window.confirm("Are you sure you want to toggle admin?") &&
			window.confirm("Are you REALLY SURE you want to toggle admin?")
		)
			this.adminService.toggleAdminUser(this.user.id).subscribe(() => {
				this.refreshUser();
			});
	}
}
