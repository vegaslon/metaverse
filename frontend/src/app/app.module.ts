import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { RecaptchaFormsModule, RecaptchaModule } from "ng-recaptcha";
import { AppComponent } from "./app.component";
import { AuthInterceptorService } from "./auth/auth-interceptor.service";
import { AuthGuard } from "./auth/auth.guard";
import { DownloadComponent } from "./header/download/download.component";
import { HeaderComponent } from "./header/header.component";
import { SignInComponent } from "./header/sign-in/sign-in.component";
import { HomeComponent } from "./home/home.component";
import { MaterialModule } from "./material.module";
import { AdminGuard } from "./auth/admin.guard";

const routes: Routes = [
	{ path: "", component: HomeComponent },
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
		BrowserModule,
		MaterialModule,
		BrowserAnimationsModule,
		HttpClientModule,
		ReactiveFormsModule,
		RouterModule.forRoot(routes, {
			//scrollPositionRestoration: "enabled",
			preloadingStrategy: PreloadAllModules,
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
