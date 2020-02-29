import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { User } from "@sentry/browser";
import { forkJoin } from "rxjs";
import { AuthService } from "src/app/auth/auth.service";
import { formatBytes } from "../../utils";
import { FilesService, Folder, Status } from "./files.service";
import { UploadComponent } from "./upload/upload.component";

@Component({
	selector: "app-files",
	templateUrl: "./files.component.html",
	styleUrls: ["./files.component.scss"],
})
export class FilesComponent implements OnInit {
	public formatBytes = formatBytes;

	rootFolder = new Folder("");
	currentFolder = new Folder("");

	loading = true;
	status: Status = {} as any;
	total = 0;

	user: User = {} as any;

	constructor(
		public readonly filesService: FilesService,
		private readonly authService: AuthService,
		private readonly dialog: MatDialog,
	) {}

	ngOnInit() {
		forkJoin({
			files: this.filesService.getFiles(),
			status: this.filesService.getStatus(),
		}).subscribe(data => {
			this.rootFolder = data.files.folder;
			this.currentFolder = data.files.folder;
			this.total = data.files.total;
			this.status = data.status;

			this.loading = false;
		});

		this.authService.user$.subscribe(user => {
			this.user = user;
		});
	}

	onUpload() {
		this.dialog.open(UploadComponent);
	}

	getBreadcrumbs() {
		const breadcrumbs: Folder[] = [];
		let currentFolder = this.currentFolder;

		while (currentFolder.parent != null) {
			breadcrumbs.unshift(currentFolder);
			currentFolder = currentFolder.parent;
		}

		return breadcrumbs;
	}

	changeCurrentFolder(folder: Folder) {
		this.currentFolder = folder;
	}

	// dragOver = false;

	// @HostListener("window:dragover", ["$event"])
	// onDragOver(event: DragEvent) {
	// 	event.preventDefault();
	// 	this.dragOver = true;
	// }

	// // @HostListener("#dragOver:dragleave", ["$event"])
	// // onDragLeave(event: DragEvent) {
	// // 	event.preventDefault();
	// // 	this.dragOver = false;
	// // 	console.log("leave");
	// // }

	// @HostListener("window:drop", ["$event"])
	// onDrop(event: DragEvent) {
	// 	event.preventDefault();
	// 	if (event.dataTransfer.files.length == 0) return;

	// 	const files = event.dataTransfer.files;
	// 	console.log(files);
	// }
}
