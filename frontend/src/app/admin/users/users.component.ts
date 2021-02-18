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

	type: "all" | "online" | "banned" = "all";

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
			if (url.some(segment => segment.path.includes("online"))) {
				this.type = "online";
			}
			if (url.some(segment => segment.path.includes("banned"))) {
				this.type = "banned";
			}
			this.loadMore();
		});
	}

	loadMore(offset = 0) {
		const h = (users: AdminUser[]) => {
			this.users = offset === 0 ? users : [...this.users, ...users];
		};

		if (this.type == "all") {
			this.adminService.getUsers(offset, this.search).subscribe(h);
		} else if (this.type == "online") {
			this.adminService.getOnlineUsers(offset, this.search).subscribe(h);
		} else if (this.type == "banned") {
			this.adminService.getBannedUsers(offset, this.search).subscribe(h);
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
