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

	ontop = false;

	private subs: Subscription[] = [];

	@ViewChild("mobileMenu") mobileMenuRef: ElementRef<HTMLDivElement>;

	constructor(
		public readonly dialog: MatDialog,
		private readonly authService: AuthService,
		private readonly router: Router,
	) {}

	onToggleMobileMenu(forceCollapse = false) {
		const isCollapsed = this.mobileMenuRef.nativeElement.classList.contains(
			"collapsed",
		);

		if (isCollapsed && forceCollapse) return;

		if (isCollapsed && forceCollapse == false) {
			this.mobileMenuRef.nativeElement.classList.remove("collapsed");
		} else {
			this.mobileMenuRef.nativeElement.classList.add("collapsed");
		}
	}

	ngOnInit() {
		this.subs.push(
			this.authService.user$.subscribe(user => {
				this.user = user;
			}),
			this.router.events.subscribe(val => {
				if (val instanceof NavigationEnd) {
					this.onToggleMobileMenu(true);
					this.ontop = val.url === "/" || val.url === "/download";
				}
			}),
		);
	}

	ngOnDestroy() {
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}

	onSignIn() {
		this.dialog.open(SignInComponent);
	}

	onSignOut() {
		this.authService.logout();
	}
}
