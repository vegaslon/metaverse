import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AdminComponent } from "./admin.component";
import { Routes, RouterModule } from "@angular/router";
import { MaterialModule } from "../material.module";

const routes: Routes = [{ path: "", component: AdminComponent }];

@NgModule({
	declarations: [AdminComponent],
	imports: [CommonModule, RouterModule.forChild(routes), MaterialModule],
})
export class AdminModule {}
