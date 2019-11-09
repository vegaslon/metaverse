import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";
import {
	HttpInterceptor,
	HttpRequest,
	HttpHandler,
	HttpEvent,
	HttpHeaders,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { exhaustMap, take } from "rxjs/operators";

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
	constructor(private authService: AuthService) {}

	intercept(
		req: HttpRequest<any>,
		next: HttpHandler,
	): Observable<HttpEvent<any>> {
		const user = this.authService.user.getValue();

		if (user == null) {
			return next.handle(req);
		}

		const headers = new HttpHeaders({
			Authorization: "Bearer " + user.jwt,
		});

		return next.handle(req.clone({ headers }));
	}
}
