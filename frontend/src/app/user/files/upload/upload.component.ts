import { Component, ElementRef, ViewChild } from "@angular/core";
import { formatBytes, formatExt } from "../../../utils";
import { FilesService } from "../files.service";

@Component({
	selector: "app-upload",
	templateUrl: "./upload.component.html",
	styleUrls: ["./upload.component.scss"],
})
export class UploadComponent {
	public formatBytes = formatBytes;
	public formatExt = formatExt;

	@ViewChild("filesInput") filesInput: ElementRef<HTMLInputElement>;
	fileList: File[] = [];
	totalSize = 0;

	constructor(public readonly filesService: FilesService) {}

	onFilesChanged() {
		this.fileList = [...(this.filesInput.nativeElement.files as any)];
		this.totalSize = this.fileList.reduce((total, file) => file.size, 0);
	}

	onClearFiles() {
		this.filesInput.nativeElement.value = "";
	}
}
