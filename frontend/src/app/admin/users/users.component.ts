import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { UtilsService } from "../../utils.service";
import { AdminService, AdminUser } from "../admin.service";

@Component({
	selector: "app-users",
	templateUrl: "./users.component.html",
	styleUrls: ["./users.component.scss"],
})
export class UsersComponent implements OnInit {
	users: AdminUser[] = [];
	search = "";

	onlineUsers = false;

	@ViewChild(CdkVirtualScrollViewport)
	viewport: CdkVirtualScrollViewport;

	constructor(
		private readonly adminService: AdminService,
		private readonly authService: AuthService,
		private readonly route: ActivatedRoute,
		public readonly utilsService: UtilsService,
	) {}

	ngOnInit() {
		this.route.url.subscribe(url => {
			this.onlineUsers = url.some(segment =>
				segment.path.includes("online"),
			);
			this.loadMore();
		});
	}

	loadMore(offset = 0) {
		if (this.onlineUsers) {
			this.adminService
				.getOnlineUsers(offset, this.search)
				.subscribe(users => {
					this.users =
						offset === 0 ? users : [...this.users, ...users];
				});
		} else {
			this.adminService.getUsers(offset, this.search).subscribe(users => {
				this.users = offset === 0 ? users : [...this.users, ...users];
			});
		}
	}

	scrolledIndexChanged(index: number) {
		if (this.users.length > 0 && index > this.users.length - 50) {
			this.loadMore(this.users.length - 1);
		}
	}

	onSearch(event: KeyboardEvent) {
		const newSearch = (event.target as HTMLInputElement).value;
		if (this.search === newSearch) return;
		this.search = newSearch;
		this.loadMore();
	}

	onRefresh() {
		this.loadMore();
	}
}
