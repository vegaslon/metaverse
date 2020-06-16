import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SsoComponent } from "./sso/sso.component";
import { RouterModule, Routes } from "@angular/router";
import { SsoRedirectingComponent } from "./sso/sso-redirecting/sso-redirecting.component";
import { MaterialModule } from "../material.module";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { VerifyEmailComponent } from "./verify-email/verify-email.component";
import { ReactiveFormsModule } from "@angular/forms";

const routes: Routes = [
	{ path: "sso/:service", component: SsoComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [
		SsoComponent,
		SsoRedirectingComponent,
		VerifyEmailComponent,
		ResetPasswordComponent,
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		MaterialModule,
		ReactiveFormsModule,
	],
	entryComponents: [
		SsoRedirectingComponent,
		VerifyEmailComponent,
		ResetPasswordComponent,
	],
})
export class AuthModule {}
