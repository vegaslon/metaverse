import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExploreComponent } from "./explore.component";
import { Routes, RouterModule } from "@angular/router";
import { UiModule } from "../ui/ui.module";
import { MaterialModule } from "../material.module";

const routes: Routes = [{ path: "", component: ExploreComponent }];

@NgModule({
	declarations: [ExploreComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
	],
})
export class ExploreModule {}
