import { Component, OnInit } from "@angular/core";
import { AdminOnlineUser, AdminService, AdminUser } from "./admin.service";

@Component({
	selector: "app-admin",
	templateUrl: "./admin.component.html",
	styleUrls: ["./admin.component.scss"],
})
export class AdminComponent implements OnInit {
	onlineUsers: AdminOnlineUser[] = [];
	onlineUsersCols = ["image", "username", "minutes", "location"];

	users: AdminUser[] = [];
	usersCols = ["image", "username", "email", "minutes"];

	fetchOnlineUsers() {
		const sub = this.adminService.getOnlineUsers().subscribe(
			onlineUsers => {
				this.onlineUsers = onlineUsers;
			},
			err => {},
			() => {
				sub.unsubscribe();
			},
		);
	}

	fetchUsers() {
		const sub = this.adminService.getUsers().subscribe(
			users => {
				this.users = users;
			},
			err => {},
			() => {
				sub.unsubscribe();
			},
		);
	}

	constructor(private adminService: AdminService) {
		this.fetchOnlineUsers();
		this.fetchUsers();
	}

	ngOnInit() {}
}
