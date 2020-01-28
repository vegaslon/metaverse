import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ErrorHandler, Injectable, NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import * as Sentry from "@sentry/browser";
import { RecaptchaFormsModule, RecaptchaModule } from "ng-recaptcha";
import { AppComponent } from "./app.component";
import { AdminGuard } from "./auth/admin.guard";
import { AuthInterceptorService } from "./auth/auth-interceptor.service";
import { AuthGuard } from "./auth/auth.guard";
import { VerifyEmailComponent } from "./auth/verify-email/verify-email.component";
import { DownloadComponent } from "./header/download/download.component";
import { HeaderComponent } from "./header/header.component";
import { SignInComponent } from "./header/sign-in/sign-in.component";
import { HomeComponent } from "./home/home.component";
import { MaterialModule } from "./material.module";
import { environment } from "../environments/environment";

Sentry.init({
	dsn: "https://35ced4ee7098404393553430f8d78e79@sentry.tivolicloud.com/3",
	environment: "production",
	enabled: environment.production,
});

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
	constructor() {}
	handleError(error) {
		const eventId = Sentry.captureException(error.originalError || error);
		Sentry.showReportDialog({ eventId });
	}
}

const routes: Routes = [
	{ path: "", component: HomeComponent },
	{
		path: "explore",
		loadChildren: () =>
			import("./explore/explore.module").then(m => m.ExploreModule),
	},
	{
		path: "user",
		canActivate: [AuthGuard],
		loadChildren: () =>
			import("./user/user.module").then(m => m.UserModule),
	},
	{
		path: "admin",
		canActivate: [AdminGuard],
		loadChildren: () =>
			import("./admin/admin.module").then(m => m.AdminModule),
	},
	{
		path: "stream",
		loadChildren: () =>
			import("./video-stream/video-stream.module").then(
				m => m.VideoStreamModule,
			),
	},
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [
		AppComponent,
		HeaderComponent,
		SignInComponent,
		HomeComponent,
		DownloadComponent,
		VerifyEmailComponent,
	],
	imports: [
		BrowserModule.withServerTransition({ appId: "serverApp" }),
		MaterialModule,
		BrowserAnimationsModule,
		HttpClientModule,
		ReactiveFormsModule,
		RouterModule.forRoot(routes, {
			initialNavigation: "enabled",
		}),
		RecaptchaModule,
		RecaptchaFormsModule,
	],
	providers: [
		{
			provide: ErrorHandler,
			useClass: SentryErrorHandler,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptorService,
			multi: true,
		},
	],
	bootstrap: [AppComponent],
	entryComponents: [SignInComponent, DownloadComponent, VerifyEmailComponent],
})
export class AppModule {}
