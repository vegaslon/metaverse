import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FilesService } from "../files.service";
import { FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
	selector: "app-create-folder",
	templateUrl: "./create-folder.component.html",
	styleUrls: ["./create-folder.component.scss"],
})
export class CreateFolderComponent {
	currentPath: string;

	constructor(
		private readonly filesService: FilesService,
		private readonly dialogRef: MatDialogRef<CreateFolderComponent>,
		@Inject(MAT_DIALOG_DATA) private readonly data: { currentPath: string },
	) {
		this.currentPath = data.currentPath.endsWith("/")
			? data.currentPath
			: data.currentPath + "/";
	}

	form: FormGroup = new FormGroup({
		path: new FormControl(null, [Validators.required]),
	});

	onCancel() {
		this.dialogRef.close();
	}

	onCreate() {
		if (this.form.invalid) return;

		this.filesService
			.createFolder(this.currentPath + this.form.value.path)
			.subscribe(() => {
				this.dialogRef.close();
			});
	}
}
