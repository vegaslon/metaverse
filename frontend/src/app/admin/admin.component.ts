import { Component, OnInit } from "@angular/core";
import { AdminService, AdminUser } from "./admin.service";

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

	constructor(private adminService: AdminService) {
		this.fetchUsersReset();
		this.fetchOnlineUsersReset();
	}

	ngOnInit() {}
}
