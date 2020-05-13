import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { AboutUsComponent } from "./about-us.component";

const routes: Routes = [
	{ path: "", component: AboutUsComponent },
	// { path: "our-team", component: OurTeamComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [AboutUsComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
	],
})
export class AboutUsModule {}
