import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { InfiniteScrollModule } from "ngx-infinite-scroll";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { AdminComponent } from "./admin.component";

const routes: Routes = [{ path: "", component: AdminComponent }];

@NgModule({
	declarations: [AdminComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		MaterialModule,
		UiModule,
		InfiniteScrollModule,
	],
})
export class AdminModule {}
