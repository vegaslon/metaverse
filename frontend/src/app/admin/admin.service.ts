import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

export interface AdminOnlineUser {
	username: string;
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
}

export interface AdminUser {
	username: string;
	email: string;
	mintues: number;
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

	getOnlineUsers() {
		return this.http
			.get<AdminOnlineUser[]>("/api/admin/users/online")
			.pipe(catchError(this.handleError));
	}

	getUsers() {
		return this.http
			.get<AdminUser[]>("/api/admin/users")
			.pipe(catchError(this.handleError));
	}
}
