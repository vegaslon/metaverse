import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PrivacyPolicyComponent } from "./privacy-policy.component";

const routes: Routes = [
	{ path: "", component: PrivacyPolicyComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [PrivacyPolicyComponent],
	imports: [CommonModule, RouterModule.forChild(routes)],
})
export class PrivacyPolicyModule {}
