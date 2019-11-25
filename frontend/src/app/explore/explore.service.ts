import { Injectable } from "@angular/core";
import {
	HttpClient,
	HttpErrorResponse,
	HttpParams,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { Domain } from "../user/user.service";

@Injectable({
	providedIn: "root",
})
export class ExploreService {
	constructor(private http: HttpClient) {}

	private handleError = (err: HttpErrorResponse): Observable<never> => {
		return throwError(err.statusText);
	};

	findOnlineDomains(page: number = 1, amount: number = 50) {
		if (page <= 0) page = 1;

		return this.http
			.get<Domain[]>("/api/domains", {
				params: new HttpParams()
					.set("page", page + "")
					.set("amount", amount + ""),
			})
			.pipe(catchError(this.handleError));
	}
}
