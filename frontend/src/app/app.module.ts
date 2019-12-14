import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes } from "@angular/router";
import { RecaptchaFormsModule, RecaptchaModule } from "ng-recaptcha";
import { AppComponent } from "./app.component";
import { AdminGuard } from "./auth/admin.guard";
import { AuthInterceptorService } from "./auth/auth-interceptor.service";
import { AuthGuard } from "./auth/auth.guard";
import { DownloadComponent } from "./header/download/download.component";
import { HeaderComponent } from "./header/header.component";
import { SignInComponent } from "./header/sign-in/sign-in.component";
import { HomeComponent } from "./home/home.component";
import { MaterialModule } from "./material.module";

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
	],
	imports: [
		BrowserModule.withServerTransition({ appId: "serverApp" }),
		MaterialModule,
		BrowserAnimationsModule,
		HttpClientModule,
		ReactiveFormsModule,
		RouterModule.forRoot(routes, {
			//scrollPositionRestoration: "enabled",
			//preloadingStrategy: PreloadAllModules,
		}),
		RecaptchaModule,
		RecaptchaFormsModule,
	],
	providers: [
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptorService,
			multi: true,
		},
	],
	bootstrap: [AppComponent],
	entryComponents: [SignInComponent, DownloadComponent],
})
export class AppModule {}
