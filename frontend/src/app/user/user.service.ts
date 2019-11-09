import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

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
}
