import { ClipboardModule } from "@angular/cdk/clipboard";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { MaterialModule } from "../material.module";
import { UiModule } from "../ui/ui.module";
import { DomainsComponent } from "./domains/domains.component";
import { CreateFolderComponent } from "./files/create-folder/create-folder.component";
import { FilesComponent } from "./files/files.component";
import { FolderViewComponent } from "./files/folder-view/folder-view.component";
import { TreeItemComponent } from "./files/tree-item/tree-item.component";
import { UploadComponent } from "./files/upload/upload.component";
import { SettingsComponent } from "./settings/settings.component";

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
		CreateFolderComponent,
	],
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		UiModule,
		MaterialModule,
		ReactiveFormsModule,
		ClipboardModule,
	],
	entryComponents: [UploadComponent, CreateFolderComponent],
})
export class UserModule {}
