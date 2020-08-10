import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthToken } from "../auth/auth.service";

export interface AdminUser {
	id: string;
	username: string;
	email: string;
	emailVerified: boolean;
	domains: { name: string; id: string }[];
	admin: boolean;
	created: string;
	minutes: number;
	supporter: boolean;
	session: {
		minutes: number;
		location: {
			availability: string;
			connected: boolean;
			domain_id: string;
			network_address: string;
			network_port: string;
			node_id: string;
			path: string;
			place_id: string;
		};
	} | null;
}

@Injectable({
	providedIn: "root",
})
export class AdminService {
	constructor(private http: HttpClient) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		//console.log(err);
		if (err.error.message) return throwError(err.error.message);
	};

	getUsers(offset = 0, search = "") {
		return this.http
			.get<AdminUser[]>(
				"/api/admin/users?offset=" + offset + "&search=" + search,
			)
			.pipe(catchError(this.handleError));
	}

	getOnlineUsers(offset = 0, search = "") {
		return this.http
			.get<AdminUser[]>(
				"/api/admin/users/online?offset=" +
					offset +
					"&search=" +
					search,
			)
			.pipe(catchError(this.handleError));
	}

	impersonateUser(userId: string) {
		return this.http
			.post<AuthToken>("/api/admin/user/" + userId + "/impersonate", {})
			.pipe(catchError(this.handleError));
	}

	getUser(username: string) {
		return this.http
			.get<AdminUser>("/api/admin/user/" + username)
			.pipe(catchError(this.handleError));
	}

	toggleVerifyUser(userId: string) {
		return this.http
			.post<AdminUser>("/api/admin/user/" + userId + "/verify", {})
			.pipe(catchError(this.handleError));
	}

	toggleAdminUser(userId: string) {
		return this.http
			.post<AdminUser>("/api/admin/user/" + userId + "/admin", {})
			.pipe(catchError(this.handleError));
	}

	toggleSupporterUser(userId: string) {
		return this.http
			.post<AdminUser>("/api/admin/user/" + userId + "/supporter", {})
			.pipe(catchError(this.handleError));
	}
}
