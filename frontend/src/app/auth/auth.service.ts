import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { environment } from "../../environments/environment";

interface AuthResponse {
	access_token: string;
	created_at: number;
	expires_in: number;
	refresh_token: string;
}

export class User {
	constructor(
		public id: string,
		public username: string,
		public email: string,
		public jwt: string,
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
		return throwError(err.statusText);
	};

	handleAuthentication = (jwt: string) => {
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
						roles: string;
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
					const { id, username, email } = profile.data.user;

					const user = new User(id, username, email, jwt);

					const token = this.jwtHelper.decodeToken(jwt);
					const msTillExpire =
						+new Date(token.exp * 1000) - +new Date();

					this.autoLogout(msTillExpire);
					this.user.next(user);
					localStorage.setItem("auth", jwt);
				},
				() => {},
				() => {
					sub.unsubscribe();
				},
			);
	};

	signUp(signUpDto: { email: string; username: string; password: string }) {
		return this.http.post<AuthResponse>("/api/auth/signup", signUpDto).pipe(
			catchError(this.handleError),
			map(result => result.access_token),
			tap(this.handleAuthentication),
		);
	}

	signIn(signInDto: { username: string; password: string }) {
		return this.http
			.post<AuthResponse>("/oauth/token", {
				grant_type: "password",
				username: signInDto.username,
				password: signInDto.password,
				scope: "owner",
			})
			.pipe(
				catchError(this.handleError),
				map(result => result.access_token),
				tap(this.handleAuthentication),
			);
	}

	autoLogin() {
		const token = localStorage.getItem("auth");
		if (!token) return;
		this.handleAuthentication(token);
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
