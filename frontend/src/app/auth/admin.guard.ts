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
import { map, mergeMap, filter } from "rxjs/operators";
import { SignInComponent } from "../header/sign-in/sign-in.component";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root",
})
export class AdminGuard implements CanActivate {
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
		if (isPlatformServer(this.platform))
			return new Observable(sub =>
				sub.next(this.router.createUrlTree(["/"])),
			);

		return this.authService.loggingIn$.pipe(
			// only when logging is has finished
			filter(loggingIn => loggingIn == false),
			mergeMap(() =>
				((): Observable<boolean | UrlTree> => {
					// if user, continue to page!
					const user = this.authService.user$.value;
					if (user != null && user.admin)
						return new Observable(sub => sub.next(true));

					// if not, login popup
					const dialog = this.dialog.open(SignInComponent);

					return dialog.afterClosed().pipe(
						map(() => {
							const user = this.authService.user$.value;
							return user != null && user.admin
								? true
								: this.router.createUrlTree(["/"]);
						}),
					);
				})(),
			),
		);
	}
}
