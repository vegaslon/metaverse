import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SignInComponent } from "./sign-in/sign-in.component";
import { DownloadComponent } from "./download/download.component";

@Component({
	selector: "app-header",
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
	private userSub: Subscription = null;
	isAuth = false;
	user: User = {} as User;

	constructor(public dialog: MatDialog, private authService: AuthService) {}

	ngOnInit() {
		if ((window as any).qt) {
			// interface code
		}

		this.userSub = this.authService.user.subscribe(user => {
			if (user == null) {
				this.isAuth = false;
			} else {
				this.isAuth = true;
				this.user = user;
			}
		});
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}

	openDownload() {
		this.dialog.open(DownloadComponent);
	}

	onSignIn() {
		this.dialog.open(SignInComponent, {
			width: "400px",
		});
	}

	onSignOut() {
		this.authService.logout();
	}
}
