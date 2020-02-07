import { isPlatformServer } from "@angular/common";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from "@angular/router";
import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { SignInComponent } from "../header/sign-in/sign-in.component";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root",
})
export class AuthGuard implements CanActivate {
	constructor(
		private authService: AuthService,
		private router: Router,
		private dialog: MatDialog,
		@Inject(PLATFORM_ID) private platform: Object,
	) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot,
	): Observable<boolean | UrlTree> {
		const afterLoggingIn = (): Observable<unknown> =>
			new Observable(sub => {
				// check if still logging in

				if (this.authService.loggingIn$.value) {
					const loggingInSub = this.authService.loggingIn$.subscribe(
						loggingIn => {
							if (loggingIn != false) return; // wait until its false
							loggingInSub.unsubscribe();
							sub.next();
						},
					);
				} else {
					sub.next();
				}
			});

		const handleUser = (): Observable<boolean | UrlTree> => {
			// if user, continue to page!

			const user = this.authService.user$.value;
			if (user != null) return new Observable(sub => sub.next(true));

			// if not, login popup

			const dialog = this.dialog.open(SignInComponent, {
				width: "400px",
			});

			return dialog.afterClosed().pipe(
				mergeMap(() => afterLoggingIn()),
				map(() => {
					const user = this.authService.user$.value;

					return user != null
						? true
						: this.router.createUrlTree(["/"]);
				}),
			);
		};

		if (isPlatformServer(this.platform))
			return new Observable(sub =>
				sub.next(this.router.createUrlTree(["/"])),
			);

		return afterLoggingIn().pipe(mergeMap(() => handleUser()));
	}
}
