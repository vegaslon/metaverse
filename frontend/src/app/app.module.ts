import { isPlatformBrowser } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { Inject, NgModule, PLATFORM_ID } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { AdminGuard } from "./auth/admin.guard";
import { AuthInterceptorService } from "./auth/auth-interceptor.service";
import { AuthGuard } from "./auth/auth.guard";
import { AuthService } from "./auth/auth.service";
import { CookieConsentComponent } from "./cookie-consent/cookie-consent.component";
import { AmdComplicationsComponent } from "./header/download/amd-complications/amd-complications.component";
import { DownloadComponent } from "./header/download/download.component";
import { HeaderComponent } from "./header/header.component";
import { SignInComponent } from "./header/sign-in/sign-in.component";
import { HomeComponent } from "./home/home.component";
import { MaterialModule } from "./material.module";

// Sentry.init({
// 	dsn: "https://35ced4ee7098404393553430f8d78e79@sentry.tivolicloud.com/3",
// 	environment: "production",
// 	enabled: environment.production,
// });

// @Injectable()
// export class SentryErrorHandler implements ErrorHandler {
// 	constructor() {}
// 	handleError(error) {
// 		Sentry.captureException(error.originalError || error);
// 		throw error;
// 	}
// }

const routes: Routes = [
	{ path: "", component: HomeComponent },
	{
		path: "download",
		component: HomeComponent,
	},
	{
		path: "amd-complications",
		component: HomeComponent,
	},
	{
		path: "about-us",
		loadChildren: () =>
			import("./about-us/about-us.module").then(m => m.AboutUsModule),
	},
	{
		path: "explore",
		loadChildren: () =>
			import("./explore/explore.module").then(m => m.ExploreModule),
	},
	{
		path: "events",
		loadChildren: () =>
			import("./events/events.module").then(m => m.EventsModule),
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
	{
		path: "auth",
		canActivate: [AuthGuard],
		loadChildren: () =>
			import("./auth/auth.module").then(m => m.AuthModule),
	},
	{
		path: "privacy-policy",
		loadChildren: () =>
			import("./privacy-policy/privacy-policy.module").then(
				m => m.PrivacyPolicyModule,
			),
	},
	{
		path: "code-of-conduct",
		loadChildren: () =>
			import("./code-of-conduct/code-of-conduct.module").then(
				m => m.CodeOfConductModule,
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
		CookieConsentComponent,
		AmdComplicationsComponent,
	],
	imports: [
		BrowserModule.withServerTransition({ appId: "serverApp" }),
		MaterialModule,
		BrowserAnimationsModule,
		HttpClientModule,
		ReactiveFormsModule,
		RouterModule.forRoot(routes, {
			initialNavigation: "enabled",
			scrollPositionRestoration: "enabled",
			relativeLinkResolution: "legacy",
			anchorScrolling: "enabled",
		}),
		// RecaptchaModule,
		// RecaptchaFormsModule,
	],
	providers: [
		// {
		// 	provide: ErrorHandler,
		// 	useClass: SentryErrorHandler,
		// },
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptorService,
			multi: true,
		},
	],
	bootstrap: [AppComponent],
	entryComponents: [SignInComponent, DownloadComponent],
})
export class AppModule {
	constructor(
		private readonly authService: AuthService,
		@Inject(PLATFORM_ID) private readonly platformId: Object,
	) {
		if (isPlatformBrowser(platformId)) {
			const query = new URLSearchParams(window.location.search);

			if (!query.has("token") && !query.has("signUp"))
				this.authService.autoLogin(); // has window
		}
	}
}
