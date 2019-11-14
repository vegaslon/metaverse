import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

export interface AuthToken {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
	scope: "owner";
	token_type: "Bearer";
}

export class User {
	constructor(
		public id: string,
		public username: string,
		public email: string,
		public admin: boolean,
		public token: AuthToken,
	) {}
}

@Injectable({
	providedIn: "root",
})
export class AuthService {
	user = new BehaviorSubject<User>(null);

	private tokenExpirationTimer: any;
	private jwtHelper = new JwtHelperService();

	constructor(private http: HttpClient, private router: Router) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		//console.log(err);
		if (err.error.message) return throwError(err.error.message);
		if (err.status == 401)
			return throwError("Invalid username and password");
	};

	handleAuthentication = (token: AuthToken) => {
		const jwt = token.access_token;

		if (this.jwtHelper.isTokenExpired(jwt))
			return throwError("Token expired");

		const sub = this.http
			.get<{
				status: boolean;
				data: {
					user: {
						id: string;
						username: string;
						email: string;
						roles: string[];
					};
				};
			}>("/api/v1/user/profile", {
				headers: new HttpHeaders({
					// user isnt available yet in the auth interceptor
					Authorization: "Bearer " + jwt,
				}),
			})
			.subscribe(
				profile => {
					const { id, username, email, roles } = profile.data.user;
					const admin = roles.includes("admin");

					const user = new User(id, username, email, admin, token);

					const payload = this.jwtHelper.decodeToken(jwt);
					const msTillExpire =
						+new Date(payload.exp * 1000) - +new Date();

					this.autoLogout(msTillExpire);
					this.user.next(user);
					localStorage.setItem("auth", JSON.stringify(token));
				},
				() => {},
				() => {
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

	autoLogin() {
		const tokenStr = localStorage.getItem("auth");
		if (!tokenStr) return;

		try {
			const token = JSON.parse(tokenStr);
			this.handleAuthentication(token);
		} catch (err) {}
	}

	logout() {
		this.user.next(null);
		this.router.navigate(["/"]);
		localStorage.removeItem("auth");
		if (this.tokenExpirationTimer) {
			clearTimeout(this.tokenExpirationTimer);
		}
	}

	autoLogout(msTillExpire: number) {
		if (msTillExpire > 0x7fffffff) return;

		this.tokenExpirationTimer = setTimeout(() => {
			this.logout();
		}, msTillExpire);
	}
}
