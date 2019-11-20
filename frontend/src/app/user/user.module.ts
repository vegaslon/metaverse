import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { SettingsComponent } from "./settings/settings.component";
import { DomainsComponent } from "./domains/domains.component";
import { TokenComponent } from "./domains/token/token.component";

const routes: Routes = [
	{ path: "", redirectTo: "settings", pathMatch: "full" },
	{ path: "settings", component: SettingsComponent },
	{ path: "domains", component: DomainsComponent },
];

@NgModule({
	declarations: [SettingsComponent, DomainsComponent, TokenComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
		ReactiveFormsModule,
	],
	entryComponents: [TokenComponent],
})
export class UserModule {}
