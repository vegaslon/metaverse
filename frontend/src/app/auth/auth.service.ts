import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
	HttpXhrBackend,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { CookieService } from "ngx-cookie-service";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, take, tap } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { AdminService, AdminUser } from "../admin/admin.service";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { VerifyEmailComponent } from "./verify-email/verify-email.component";

export interface AuthToken {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
	scope: "owner";
	token_type: "Bearer";
}

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	emailVerified: boolean;
	minutes: number;
}

export class User {
	constructor(
		public token: AuthToken,
		public profile: UserProfile,
		public admin: boolean,
	) {}
}

@Injectable({
	providedIn: "root",
})
export class AuthService {
	// TODO: change to ReplaySubject
	user$ = new BehaviorSubject<User>(null);
	loggingIn$ = new BehaviorSubject<boolean>(false);

	impersonating$ = new BehaviorSubject<boolean>(false);
	private preImpersonatingUser: User = null;

	private tokenExpirationTimer: any;
	private jwtHelper = new JwtHelperService();

	constructor(
		private readonly http: HttpClient,
		private readonly router: Router,
		private readonly dialog: MatDialog,
		private readonly cookies: CookieService,
		private readonly adminService: AdminService,
	) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		//console.log(err);
		if (err.error.message) return throwError(err.error.message);
		if (err.status == 401)
			return throwError("Invalid username and password");
	};

	openEmailVerifyDialog(verified = false) {
		this.dialog.open(VerifyEmailComponent, {
			width: "500px",
			disableClose: !verified,
			data: verified,
		});
	}

	openResetPasswordDialog(passwordToken: string) {
		this.dialog.open(ResetPasswordComponent, {
			width: "500px",
			disableClose: true,
			data: passwordToken,
		});
	}

	sendEmailVerify(email: string) {
		return this.http
			.post<string>("/api/user/verify", {
				email,
			})
			.pipe(
				catchError(err => {
					return throwError(err.error.message);
				}),
			);
	}

	getUserProfile = (jwt: string) => {
		const http = new HttpClient(
			new HttpXhrBackend({
				build: () => new XMLHttpRequest(),
			}),
		);

		return http.get<{
			status: boolean;
			statusCode?: 401; // unauthorized
			data: {
				user: UserProfile & {
					roles: string[];
				};
			};
		}>("/api/v1/user/profile", {
			headers: new HttpHeaders({
				Authorization: "Bearer " + jwt,
			}),
		});
	};

	saveToken(token: AuthToken) {
		this.cookies.set(
			"auth",
			JSON.stringify(token),
			365 * 100, // expires
			"/", // path
			null, // domain
			environment.production, // secure,
			"Lax",
		);
	}

	forgetToken() {
		this.cookies.delete("auth");
	}

	getToken(): AuthToken {
		// migrate localStorage to cookies
		// TODO: remove me after 2020
		const oldToken = localStorage.getItem("auth");
		if (oldToken) {
			const token = JSON.parse(oldToken);
			this.saveToken(token);
			localStorage.removeItem("auth");
			return token;
		}

		const token = this.cookies.get("auth");
		if (!token) return null;
		return JSON.parse(token);
	}

	handleAuthentication = (token: AuthToken, impersonating = false) => {
		const jwt = token.access_token;

		this.loggingIn$.next(true);

		if (this.jwtHelper.isTokenExpired(jwt)) {
			if (!impersonating) this.forgetToken();
			this.loggingIn$.next(false);
			return throwError("Token expired");
		}

		const sub = this.getUserProfile(jwt).subscribe(
			res => {
				const profile = res.data.user;
				const admin = profile.roles.includes("admin");

				const user = new User(token, profile, admin);
				if (profile.emailVerified === false)
					this.openEmailVerifyDialog();

				const payload = this.jwtHelper.decodeToken(jwt);
				const msTillExpire =
					+new Date(payload.exp * 1000) - +new Date();

				this.autoLogout(msTillExpire);

				this.user$.next(user);
				if (!impersonating) this.saveToken(token);

				this.impersonating$.next(impersonating);
				if (impersonating) this.router.navigate(["/"]);

				this.loggingIn$.next(false);
				sub.unsubscribe();
			},
			() => {
				this.forgetToken();

				this.loggingIn$.next(false);
				sub.unsubscribe();
			},
		);
	};

	signIn(signInDto: { username: string; password: string }) {
		return this.http
			.post<AuthToken>("/oauth/token", {
				grant_type: "password",
				username: signInDto.username,
				password: signInDto.password,
				scope: "owner",
			})
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	signUp(signUpDto: { email: string; username: string; password: string }) {
		return this.http
			.post<AuthToken>("/api/auth/signup", signUpDto)
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	extSignUp(extSignUpDto: { token: string; username: string }) {
		return this.http
			.post<AuthToken>("/api/auth/signup-external", extSignUpDto)
			.pipe(catchError(this.handleError), tap(this.handleAuthentication));
	}

	sendResetPassword(sendResetPasswordDto: { email: string }) {
		return this.http
			.post("/api/user/reset-password", sendResetPasswordDto)
			.pipe(catchError(this.handleError));
	}

	autoLogin() {
		const token = this.getToken();
		if (token == null) return;
		this.handleAuthentication(token);
	}

	logout() {
		this.user$.next(null);
		this.router.navigate(["/"]);
		this.forgetToken();
		if (this.tokenExpirationTimer) {
			clearTimeout(this.tokenExpirationTimer);
		}
	}

	autoLogout(msTillExpire: number) {
		if (msTillExpire > 0x7fffffff) return;

		if (this.tokenExpirationTimer) {
			clearTimeout(this.tokenExpirationTimer);
		}
		this.tokenExpirationTimer = setTimeout(() => {
			this.logout();
		}, msTillExpire);
	}

	impersonateUser(user: AdminUser) {
		if (this.user$.value && this.preImpersonatingUser == null)
			this.preImpersonatingUser = this.user$.value;

		this.adminService.impersonateUser(user.id).subscribe(
			token => {
				this.handleAuthentication(token, true);
			},
			err => {
				alert(err);
			},
		);
	}

	stopImpersonating() {
		if (this.preImpersonatingUser) {
			this.handleAuthentication(this.preImpersonatingUser.token);
			this.preImpersonatingUser = null;
			this.loggingIn$.pipe(take(1)).subscribe(() => {
				this.router.navigate(["/admin"]);
			});
		} else {
			this.logout();
		}
	}
}
