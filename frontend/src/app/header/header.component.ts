import { isPlatformServer } from "@angular/common";
import {
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	ViewChild,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { AuthService, User } from "../auth/auth.service";
import { SignInComponent } from "./sign-in/sign-in.component";

@Component({
	selector: "app-header",
	templateUrl: "./header.component.html",
	styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
	user: User = {} as User;
	impersonating = false;

	ontop = false;

	loggingIn = false;

	private subs: Subscription[] = [];

	@ViewChild("mobileMenu") mobileMenuRef: ElementRef<HTMLDivElement>;

	isSSR = isPlatformServer(this.platformId);

	constructor(
		public readonly dialog: MatDialog,
		private readonly authService: AuthService,
		private readonly router: Router,
		@Inject(PLATFORM_ID) private readonly platformId: Object,
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

	onStopImpersonating() {
		this.authService.stopImpersonating();
	}

	ngOnInit() {
		this.subs.push(
			this.authService.user$.subscribe(user => {
				this.user = user;
			}),
			this.authService.impersonating$.subscribe(impersonating => {
				this.impersonating = impersonating;
			}),
			this.router.events.subscribe(val => {
				if (val instanceof NavigationEnd) {
					this.onToggleMobileMenu(true);
					const url = val.url.toLowerCase();
					this.ontop =
						url === "/" ||
						/^\/\?/.test(url) ||
						url === "/download" ||
						/^\/download\?/.test(url);
				}
			}),
			this.authService.loggingIn$.subscribe(loggingIn => {
				this.loggingIn = loggingIn;
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
