import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { concat, merge, Observable } from "rxjs";
import { UtilsService } from "../../../utils.service";
import { FilesService } from "../files.service";
import { HttpEvent, HttpEventType } from "@angular/common/http";

export interface Upload {
	state: "ready" | "uploading" | "uploaded";
	progress: number;
	file: File;
}

@Component({
	selector: "app-upload",
	templateUrl: "./upload.component.html",
	styleUrls: ["./upload.component.scss"],
})
export class UploadComponent {
	@ViewChild("filesInput") filesInput: ElementRef<HTMLInputElement>;
	uploads: Upload[] = [];

	uploading = false;
	error = "";

	constructor(
		public readonly utilsService: UtilsService,
		public readonly filesService: FilesService,
		private readonly dialogRef: MatDialogRef<UploadComponent>,
		@Inject(MAT_DIALOG_DATA) private readonly data: { currentPath: string },
	) {}

	getTotalSize = () =>
		this.uploads.reduce((total, upload) => total + upload.file.size, 0);

	getUploadedSize = () =>
		this.uploads.reduce(
			(total, upload) =>
				total + upload.file.size * (upload.progress / 100),
			0,
		);

	//getUnuploadedFiles = () =>
	//	this.uploads.filter(upload => upload.state != "uploaded");

	getProgressValue = () =>
		(this.getUploadedSize() / this.getTotalSize()) * 100;

	onFilesChanged() {
		this.uploads = [...(this.filesInput.nativeElement.files as any)].map(
			file => ({
				state: "ready",
				progress: 0,
				file,
			}),
		);
	}

	onReset() {
		this.uploads = [];
		this.error = "";
		// TODO: onFilesChanges() doesnt run again when selecting the same files
	}

	onUpload() {
		this.dialogRef.disableClose = true;
		this.uploading = true;

		const uploads = this.uploads.map(upload =>
			merge(
				new Observable(sub => {
					upload.state = "uploading";
					sub.complete();
				}),
				this.filesService.uploadFile(
					this.data.currentPath +
						(this.data.currentPath.endsWith("/") ? "" : "/") +
						upload.file.name,
					upload.file,
					upload,
				),
			),
		);

		const concurrency = 4;

		merge(...uploads, concurrency).subscribe(
			(event: HttpEvent<any> & { upload: Upload }) => {
				if (event.type == HttpEventType.UploadProgress) {
					event.upload.progress = Math.round(
						(event.loaded / event.total) * 100,
					);
				}

				if (event.type == HttpEventType.Response) {
					event.upload.state = "uploaded";

					if (
						this.uploads.every(upload => upload.state == "uploaded")
					) {
						this.dialogRef.close();
					}
				}
			},
			err => {
				this.uploading = false;
				this.error = err.statusText;
			},
		);
	}
}
