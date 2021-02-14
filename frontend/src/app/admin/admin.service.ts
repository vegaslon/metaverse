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
	dev: boolean;
	maxFilesSize: number;
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

export interface OpenaiToken {
	_id: string;

	token: string;
	name: string;

	totalCalls: number;
	totalTokens: number;

	monthly: { [key: string]: { calls: number; tokens: number } };

	created: string;
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

	toggleDevUser(userId: string) {
		return this.http
			.post<AdminUser>("/api/admin/user/" + userId + "/dev", {})
			.pipe(catchError(this.handleError));
	}

	updateMaxFilesSize(userId: string, maxFilesSize: number) {
		return this.http
			.put<AdminUser>("/api/admin/user/" + userId + "/max-files-size", {
				maxFilesSize,
			})
			.pipe(catchError(this.handleError));
	}

	createOpenaiToken(name: string) {
		return this.http
			.post<{}>("/api/admin/openai/create-token", { name })
			.pipe(catchError(this.handleError));
	}

	getOpenaiTokens() {
		return this.http.get<OpenaiToken[]>("/api/admin/openai/tokens");
	}

	deleteOpenaiToken(id: string) {
		return this.http
			.delete<{}>("/api/admin/openai/token/" + id)
			.pipe(catchError(this.handleError));
	}

	renameOpenaiToken(id: string, name: string) {
		return this.http
			.put<{}>("/api/admin/openai/token/" + id + "/rename", { name })
			.pipe(catchError(this.handleError));
	}

	refreshOpenaiToken(id: string) {
		return this.http
			.post<{}>("/api/admin/openai/token/" + id + "/refresh", {})
			.pipe(catchError(this.handleError));
	}
}
