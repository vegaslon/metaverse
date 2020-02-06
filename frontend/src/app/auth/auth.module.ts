import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SsoComponent } from "./sso/sso.component";
import { RouterModule, Routes } from "@angular/router";
import { SsoRedirectingComponent } from "./sso/sso-redirecting/sso-redirecting.component";
import { MaterialModule } from "../material.module";

const routes: Routes = [
	{ path: "sso/:service", component: SsoComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [SsoComponent, SsoRedirectingComponent],
	imports: [CommonModule, RouterModule.forChild(routes), MaterialModule],
	entryComponents: [SsoRedirectingComponent],
})
export class AuthModule {}
