import {
	HttpClient,
	HttpErrorResponse,
	HttpParams,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthToken } from "../auth/auth.service";

export interface AdminUser {
	online: boolean;
	username: string;
	id: string;
	created: string;
	email: string;
	mintues: number;
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

	getUsers(page = 1, amount = 50, onlineSorted = false) {
		return this.http
			.get<AdminUser[]>("/api/admin/users", {
				params: new HttpParams()
					.set("page", page + "")
					.set("amount", amount + "")
					.set("onlineSorted", onlineSorted + ""),
			})
			.pipe(catchError(this.handleError));
	}

	impersonateUser(userId: string) {
		return this.http.post<AuthToken>("/api/admin/users/impersonate", {
			userId,
		});
	}
}
