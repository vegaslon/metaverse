import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";

export interface Domain {
	id: string;
	label: string;
	username: string;
	description: string;
	restriction: "open" | "hifi" | "acl";

	online: boolean;
	numUsers: number;

	placename: string;
	networkAddress: string;
	networkPort: string;
}

@Injectable({
	providedIn: "root",
})
export class UserService {
	constructor(private http: HttpClient) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		//console.log(err);
		return throwError(err.statusText);
	};

	updateUserDetails(data: { email: string; password: string }) {
		return this.http
			.patch("/api/user", data)
			.pipe(catchError(this.handleError));
	}

	updateUserImage(data: { image: File }) {
		const formData = new FormData();
		formData.set("image", data.image);

		return this.http
			.put("/api/user/image", formData)
			.pipe(catchError(this.handleError));
	}

	getUserDomains() {
		return this.http
			.get<Domain[]>("/api/user/domains")
			.pipe(catchError(this.handleError));
	}

	generateDomainAccessToken(id: string) {
		return this.http
			.post<{ token: string }>("/api/user/domain/" + id + "/token", null)
			.pipe(
				catchError(this.handleError),
				map(data => data.token),
			);
	}

	// updating domains

	updateDomainImage(id: string, data: { image: File }) {
		const formData = new FormData();
		formData.set("image", data.image);

		return this.http
			.put("/api/user/domain/" + id + "/image", formData)
			.pipe(catchError(this.handleError));
	}

	updateUserDomain(id: string, domain: any) {
		return this.http
			.patch<Domain>("/api/user/domain/" + id, { domain })
			.pipe(catchError(this.handleError));
	}

	deleteUserDomain(id: string) {
		return this.http
			.delete("/api/user/domain/" + id)
			.pipe(catchError(this.handleError));
	}

	createUserDomain(domain: any) {
		return this.http
			.post("/api/user/domain", domain)
			.pipe(catchError(this.handleError));
	}
}
