import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { DomainsComponent } from "./domains/domains.component";
import { SettingsComponent } from "./settings/settings.component";

const routes: Routes = [
	{ path: "", redirectTo: "settings", pathMatch: "full" },
	{ path: "settings", component: SettingsComponent },
	{ path: "worlds", component: DomainsComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [SettingsComponent, DomainsComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
		ReactiveFormsModule,
	],
	entryComponents: [],
})
export class UserModule {}
