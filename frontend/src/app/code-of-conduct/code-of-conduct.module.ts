import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CodeOfConductComponent } from "./code-of-conduct.component";

const routes: Routes = [
	{ path: "", component: CodeOfConductComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [CodeOfConductComponent],
	imports: [CommonModule, RouterModule.forChild(routes)],
})
export class CodeOfConductModule {}
