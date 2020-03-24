import {
	Component,
	OnDestroy,
	OnInit,
	ViewChild,
	ElementRef,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SignInComponent } from "./sign-in/sign-in.component";
import { DownloadComponent } from "./download/download.component";
import { Router, NavigationEnd } from "@angular/router";

@Component({
	selector: "app-header",
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
	user: User = {} as User;

	private userSub: Subscription;
	private routerEventsSub: Subscription;

	@ViewChild("mobileMenu") mobileMenuRef: ElementRef<HTMLDivElement>;

	constructor(
		public readonly dialog: MatDialog,
		private readonly authService: AuthService,
		private readonly router: Router,
	) {}

	onToggleMobileMenu(forceClose = false) {
		if (
			this.mobileMenuRef.nativeElement.style.length > 0 &&
			forceClose == false
		) {
			this.mobileMenuRef.nativeElement.removeAttribute("style");
		} else {
			this.mobileMenuRef.nativeElement.style.maxHeight = "0";
			this.mobileMenuRef.nativeElement.style.padding = "0";
		}
	}

	ngOnInit() {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.routerEventsSub = this.router.events.subscribe(val => {
			if (val instanceof NavigationEnd) this.onToggleMobileMenu(true);
		});
	}

	ngOnDestroy() {
		this.userSub.unsubscribe();
		this.routerEventsSub.unsubscribe();
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
