import { HttpEvent, HttpEventType } from "@angular/common/http";
import { Component, HostListener, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { merge, Observable } from "rxjs";
import { UtilsService } from "../../../utils.service";
import { FilesService } from "../files.service";

export interface Upload {
	state: "ready" | "uploading" | "uploaded";
	progress: number;
	file: File;
	// error: string;
	error: boolean;
}

@Component({
	selector: "app-upload",
	templateUrl: "./upload.component.html",
	styleUrls: ["./upload.component.scss"],
})
export class UploadComponent {
	uploads: Upload[] = [];

	uploading = false;
	error = "";
	disabled = false;

	private readonly maxSize = "32 MB";
	private readonly maxSizeBytes = 32000000;

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

	getProgressValue = () =>
		(this.getUploadedSize() / this.getTotalSize()) * 100;

	dragOvers = 0;

	@HostListener("dragover", ["$event"])
	onDragOver(event: DragEvent) {
		event.preventDefault();
	}
	@HostListener("dragenter", ["$event"])
	onDragEnter(event: DragEvent) {
		event.preventDefault();
		this.dragOvers++;
	}
	@HostListener("dragleave", ["$event"])
	onDragLeave(event: DragEvent) {
		event.preventDefault();
		this.dragOvers--;
	}

	@HostListener("drop", ["$event"])
	onDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer.files.length === 0) return;

		this.onFilesChanged(event.dataTransfer.files);
		this.dragOvers = 0;
	}

	openFilesInput(e: MouseEvent, filesInput: HTMLInputElement) {
		e.stopPropagation();
		filesInput.click();
	}

	onFilesChanged(files: FileList) {
		let hasMaxSize = false;

		this.uploads = [...(files as any)].map(file => {
			const isMaxSize = file.size > this.maxSizeBytes;
			if (isMaxSize) hasMaxSize = true;

			return {
				state: "ready",
				progress: 0,
				file,
				error: isMaxSize,
			};
		});

		this.error = hasMaxSize ? "Maximum file size is " + this.maxSize : "";
		this.disabled = hasMaxSize;
	}

	onReset() {
		this.uploads = [];
		this.error = "";
		// TODO: onFilesChanges() doesnt run again when selecting the same files
	}

	onUpload() {
		if (this.disabled) return;

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

		const concurrency = 8;

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
			error => {
				this.dialogRef.disableClose = false;
				this.uploading = false;
				this.error = error;
			},
		);
	}
}
