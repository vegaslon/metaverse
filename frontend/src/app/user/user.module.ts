import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { DomainsComponent } from "./domains/domains.component";
import { SettingsComponent } from "./settings/settings.component";
import { FilesComponent } from "./files/files.component";
import { TreeItemComponent } from "./files/tree-item/tree-item.component";
import { FolderViewComponent } from "./files/folder-view/folder-view.component";
import { UploadComponent } from "./files/upload/upload.component";

const routes: Routes = [
	{ path: "", redirectTo: "settings", pathMatch: "full" },
	{ path: "files", component: FilesComponent },
	{ path: "worlds", component: DomainsComponent },
	{ path: "settings", component: SettingsComponent },
	{ path: "**", redirectTo: "/" },
];

@NgModule({
	declarations: [
		SettingsComponent,
		DomainsComponent,
		FilesComponent,
		TreeItemComponent,
		FolderViewComponent,
		UploadComponent,
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
		ReactiveFormsModule,
	],
	entryComponents: [UploadComponent],
})
export class UserModule {}
