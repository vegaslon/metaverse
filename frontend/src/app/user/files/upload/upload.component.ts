import { Component, ElementRef, ViewChild, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { displayPlural, formatBytes, formatExt } from "../../../utils";
import { FilesService } from "../files.service";
import { concat } from "rxjs";

interface Upload {
	uploaded: boolean;
	file: File;
}

@Component({
	selector: "app-upload",
	templateUrl: "./upload.component.html",
	styleUrls: ["./upload.component.scss"],
})
export class UploadComponent {
	public formatBytes = formatBytes;
	public formatExt = formatExt;
	public displayPlural = displayPlural;

	@ViewChild("filesInput") filesInput: ElementRef<HTMLInputElement>;
	uploads: Upload[] = [];
	totalSize = 0;

	uploading = false;
	error = "";

	constructor(
		public readonly filesService: FilesService,
		private readonly dialogRef: MatDialogRef<UploadComponent>,
		@Inject(MAT_DIALOG_DATA) private readonly data: { currentPath: string },
	) {}

	getUnuploaded = () => this.uploads.filter(file => !file.uploaded);

	private calcTotalSize() {
		this.totalSize = this.getUnuploaded().reduce(
			(total, file) => total + file.file.size,
			0,
		);
	}

	onFilesChanged() {
		this.uploads = [...(this.filesInput.nativeElement.files as any)].map(
			file => ({
				uploaded: false,
				file,
			}),
		);

		this.calcTotalSize();
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
			this.filesService.uploadFile(
				this.data.currentPath + "/" + upload.file.name,
				upload.file,
				upload,
			),
		);

		concat(...uploads).subscribe(
			data => {
				data.upload.uploaded = true;

				if (this.getUnuploaded().length == 0) {
					this.dialogRef.close();
				}
			},
			err => {
				this.uploading = false;
				this.error = err.statusText;
			},
		);
	}
}
