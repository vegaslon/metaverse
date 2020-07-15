import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EventsComponent } from "./events.component";
import { MaterialModule } from "../material.module";

const routes: Routes = [
	{ path: "", component: EventsComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [EventsComponent],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		HttpClientModule,
		MaterialModule,
	],
})
export class EventsModule {}
