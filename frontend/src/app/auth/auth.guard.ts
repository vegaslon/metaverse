import { Injectable } from "@angular/core";
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from "@angular/router";
import { Observable } from "rxjs";
import { map, take } from "rxjs/operators";
import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root",
})
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService, private router: Router) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot,
	): Observable<boolean | UrlTree> {
		const handleUser = () => {
			const user = this.authService.user$.value;
			if (user != null) return true;
			return this.router.createUrlTree(["/"]);
		};

		return new Observable(sub => {
			const loggingIn = this.authService.loggingIn$.value;

			if (loggingIn) {
				const loggingIngSub = this.authService.loggingIn$.subscribe(
					loggingIn => {
						if (loggingIn != false) return; // wait until its done
						sub.next(handleUser());
						loggingIngSub.unsubscribe();
					},
				);
			} else {
				sub.next(handleUser());
			}
		});
	}
}
