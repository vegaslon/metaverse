import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { UtilsService } from "../../utils.service";
import { AdminService, AdminUser } from "../admin.service";

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
		public readonly utilsService: UtilsService,
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

	onToggleSupporter() {
		if (window.confirm("Are you sure you want to toggle supporter?"))
			this.adminService
				.toggleSupporterUser(this.user.id)
				.subscribe(() => {
					this.refreshUser();
				});
	}

	onToggleDev() {
		if (window.confirm("Are you sure you want to toggle dev?"))
			this.adminService.toggleDevUser(this.user.id).subscribe(() => {
				this.refreshUser();
			});
	}

	onUpdateMaxFilesSize(maxFilesSizeInput: HTMLInputElement) {
		const maxFilesSize = Number(maxFilesSizeInput.value);
		if (Number.isNaN(maxFilesSize))
			return window.alert("Invalid max files size");

		if (
			window.confirm(
				"Are you sure you want to update max files size to " +
					maxFilesSize +
					" GB?",
			)
		)
			this.adminService
				.updateMaxFilesSize(this.user.id, maxFilesSize)
				.subscribe(() => {
					this.refreshUser();
				});
	}
}
