import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouterModule, Routes, PreloadAllModules } from "@angular/router";
import { RecaptchaFormsModule, RecaptchaModule } from "ng-recaptcha";
import { AppComponent } from "./app.component";
import { AuthInterceptorService } from "./auth/auth-interceptor.service";
import { HeaderComponent } from "./header/header.component";
import { SignInComponent } from "./header/sign-in/sign-in.component";
import { MaterialModule } from "./material.module";
import { HomeComponent } from "./home/home.component";
import { ImagePickerComponent } from "./ui/image-picker/image-picker.component";
import { UiModule } from "./ui/ui.module";

const routes: Routes = [
	{ path: "", component: HomeComponent },
	{
		path: "user",
		loadChildren: () =>
			import("./user/user.module").then(m => m.UserModule),
	},
];

@NgModule({
	declarations: [
		AppComponent,
		HeaderComponent,
		SignInComponent,
		HomeComponent,
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
	entryComponents: [SignInComponent],
})
export class AppModule {}
