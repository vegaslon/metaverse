import { Component, OnInit } from "@angular/core";
import { AdminService, AdminUser } from "./admin.service";
import { AuthService } from "../auth/auth.service";

@Component({
	selector: "app-admin",
	templateUrl: "./admin.component.html",
	styleUrls: ["./admin.component.scss"],
})
export class AdminComponent implements OnInit {
	users: AdminUser[] = [];
	usersCols = [
		"image",
		"username",
		"email",
		"created",
		"minutes",
		"onlineMinutes",
		"onlineLocation",
		"settings",
	];
	usersPage = 1;
	//usersError = "";

	onlineUsers: AdminUser[] = [];
	onlineUsersCols = [
		"image",
		"username",
		"email",
		"created",
		"minutes",
		"onlineMinutes",
		"onlineLocation",
	];
	onlineUsersPage = 1;
	//onlineUsersError = "";

	fetchUsersReset() {
		this.users = [];
		this.usersPage = 1;

		const sub = this.adminService
			.getUsers(this.usersPage, 50, false)
			.subscribe(
				users => {
					this.users = users;
				},
				err => {
					sub.unsubscribe();
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	fetchUsersMore() {
		this.usersPage++;

		const sub = this.adminService
			.getUsers(this.usersPage, 50, false)
			.subscribe(
				users => {
					this.users = [...this.users, ...users];
				},
				err => {
					sub.unsubscribe();
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	fetchOnlineUsersReset() {
		this.onlineUsers = [];
		this.onlineUsersPage = 1;

		const sub = this.adminService
			.getUsers(this.onlineUsersPage, 50, true)
			.subscribe(
				users => {
					this.onlineUsers = users;
				},
				err => {
					sub.unsubscribe();
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	fetchOnlineUsersMore() {
		this.onlineUsersPage++;

		const sub = this.adminService
			.getUsers(this.onlineUsersPage, 50, true)
			.subscribe(
				users => {
					this.onlineUsers = [...this.onlineUsers, ...users];
				},
				err => {
					sub.unsubscribe();
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	impersonateUser(user: AdminUser) {
		if (
			confirm(
				"Are you sure you want to impersonate " + user.username + "?",
			) == false
		)
			return;

		this.adminService.impersonateUser(user.id).subscribe(
			token => {
				this.authService.logout();
				this.authService.handleAuthentication(token);
			},
			err => {
				alert(err);
			},
		);
	}

	constructor(
		private readonly adminService: AdminService,
		private readonly authService: AuthService,
	) {
		this.fetchUsersReset();
		this.fetchOnlineUsersReset();
	}

	ngOnInit() {}
}
