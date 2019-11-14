import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { SettingsComponent } from "./settings/settings.component";

const routes: Routes = [
	{ path: "", redirectTo: "settings", pathMatch: "full" },
	{ path: "settings", component: SettingsComponent },
];

@NgModule({
	declarations: [SettingsComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
		ReactiveFormsModule,
	],
})
export class UserModule {}
