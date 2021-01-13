import { Clipboard } from "@angular/cdk/clipboard";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import {
	Component,
	EventEmitter,
	HostListener,
	Inject,
	Input,
	Output,
	PLATFORM_ID,
} from "@angular/core";
import { Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UtilsService } from "../../../utils.service";
import { EditorComponent } from "../editor/editor.component";
import { File, FilesService, Folder } from "../files.service";
import { InputComponent } from "../input/input.component";

interface ContextMenu {
	type: "file" | "folder";

	file: File;
	folder: Folder;
	x: number;
	y: number;

	teaOnly: boolean;

	httpUrlCopied: boolean;
	teaUrlCopied: boolean;

	areYouSureDelete: boolean;
	loading: boolean;
}

@Component({
	selector: "app-folder-view",
	templateUrl: "./folder-view.component.html",
	styleUrls: ["./folder-view.component.scss"],
})
export class FolderViewComponent {
	@Input() folder: Folder;
	@Output() onFolderClick = new EventEmitter<Folder>();
	@Output() onRefresh = new EventEmitter<null>();

	constructor(
		public readonly utilsService: UtilsService,
		public readonly filesService: FilesService,
		@Inject(PLATFORM_ID) private readonly platformId: any,
		private clipboard: Clipboard,
		private dialog: MatDialog,
	) {}

	encodeURI(uri: string) {
		return encodeURI(uri);
	}

	onItemClick(file: File) {
		if (!file.teaOnly && isPlatformBrowser(this.platformId))
			window.open(file.httpUrl);
	}

	contextMenu: ContextMenu = null;

	onItemContextMenu(
		type: "file" | "folder",
		item: File | Folder,
		e: MouseEvent,
	) {
		e.preventDefault();

		this.contextMenu = {
			type,

			file: type == "file" ? (item as any) : null,
			folder: type == "folder" ? (item as any) : null,
			x: e.clientX,
			y: e.clientY,

			httpUrlCopied: false,
			teaUrlCopied: false,

			teaOnly: item.teaOnly,

			areYouSureDelete: false,
			loading: false,
		};
	}

	@HostListener("window:mousedown", ["$event"])
	private onContextMenuClickAway(e: MouseEvent) {
		if (this.contextMenu == null) return;

		if (
			[...(e as any).composedPath()].some((e: HTMLElement) =>
				e.className == undefined
					? false
					: e.className.includes("context-menu"),
			) == false
		)
			this.contextMenu = null;
	}

	onContextMenuCopyHttpUrl() {
		this.clipboard.copy(this.contextMenu.file.httpUrl);
		this.contextMenu.teaUrlCopied = false;
		this.contextMenu.httpUrlCopied = true;
	}

	onContextMenuCopyTeaUrl() {
		this.clipboard.copy(this.contextMenu.file.teaUrl);
		this.contextMenu.httpUrlCopied = false;
		this.contextMenu.teaUrlCopied = true;
	}

	private onContextMenuMoveFile() {
		const oldKey = this.contextMenu.file.key;

		const currentPath = oldKey.split("/").slice(0, -1).join("/");

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputSuffix: "/" + this.contextMenu.file.name,
				inputDefault: currentPath || "/",

				titleText: "Move a file",
				buttonText: "Move file",
				buttonIcon: "folder",

				validators: [],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey =
					value +
					(value.endsWith("/") ? "" : "/") +
					this.contextMenu.file.name;

				this.filesService.moveFile(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	private onContextMenuMoveFolder() {
		const currentPath = this.contextMenu.folder
			.getBreadcrumbs()
			.map(folder => folder.name)
			.join("/");

		const oldKey = "/" + currentPath;

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputPrefix: "/",
				inputDefault: currentPath,

				titleText: "Move a folder",
				buttonText: "Move folder",
				buttonIcon: "folder",

				validators: [],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey = "/" + value;

				this.filesService.moveFolder(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	onContextMenuMove() {
		if (this.contextMenu.type == "file") {
			return this.onContextMenuMoveFile();
		} else if (this.contextMenu.type == "folder") {
			return this.onContextMenuMoveFolder();
		}
	}

	private onContextMenuRenameFile() {
		const oldKey = this.contextMenu.file.key;

		const currentPath = oldKey.split("/").slice(0, -1).join("/") + "/";

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputPrefix: currentPath,
				inputDefault: this.contextMenu.file.name,

				titleText: "Rename a file",
				buttonText: "Rename file",
				buttonIcon: "create",

				validators: [
					Validators.pattern(/^[^\/]*?$/), // no slashes
				],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey = currentPath + value;

				this.filesService.moveFile(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	private onContextMenuRenameFolder() {
		let currentPath =
			"/" +
			this.contextMenu.folder
				.getBreadcrumbs()
				.slice(0, -1)
				.map(folder => folder.name)
				.join("/");
		if (!currentPath.endsWith("/")) currentPath += "/";

		const oldKey = currentPath + this.contextMenu.folder.name;

		const dialog = this.dialog.open(InputComponent, {
			width: "600px",
			data: {
				inputPrefix: currentPath,
				inputDefault: this.contextMenu.folder.name,

				titleText: "Rename a folder",
				buttonText: "Rename folder",
				buttonIcon: "create",

				validators: [
					Validators.pattern(/^[^\/]*?$/), // no slashes
				],
			},
		});

		const submitSub = dialog.componentInstance.onSubmit.subscribe(
			(value: string) => {
				const newKey = currentPath + value;

				this.filesService.moveFolder(oldKey, newKey).subscribe(() => {
					dialog.close();
					this.onRefresh.emit();
					this.contextMenu = null;

					submitSub.unsubscribe();
				});
			},
		);
	}

	onContextMenuRename() {
		if (this.contextMenu.type == "file") {
			return this.onContextMenuRenameFile();
		} else if (this.contextMenu.type == "folder") {
			return this.onContextMenuRenameFolder();
		}
	}

	onContextMenuToggleTea() {
		const contextMenu = this.contextMenu;
		contextMenu.loading = true;

		const obs =
			this.contextMenu.type == "file"
				? this.filesService.toggleTeaOnlyFile(this.contextMenu.file.key)
				: this.filesService.toggleTeaOnlyFolder(
						this.contextMenu.folder.key,
				  );

		obs.subscribe(() => {
			this.onRefresh.emit();
			if (this.contextMenu == contextMenu) this.contextMenu = null;
		});
	}

	onContextMenuEditFile() {
		this.dialog.open(EditorComponent, {
			width: "calc(100vw - 50px)",
			height: "calc(100vh - 50px)",
			disableClose: true,
			data: {
				file: this.contextMenu.file,
			},
		});
		this.contextMenu = null;
	}

	onContextMenuDownload() {
		if (isPlatformServer(this.platformId)) return;
		window.open(this.contextMenu.file.httpUrl + "?download", "_self");
	}

	onContextMenuDelete() {
		if (this.contextMenu.areYouSureDelete == false) {
			this.contextMenu.areYouSureDelete = true;
			return;
		}

		const contextMenu = this.contextMenu;
		contextMenu.loading = true;

		const obs =
			contextMenu.type == "file"
				? this.filesService.deleteFile(this.contextMenu.file.key)
				: this.filesService.deleteFolder(this.contextMenu.folder.key);

		obs.subscribe(
			() => {
				this.onRefresh.emit();
				if (this.contextMenu == contextMenu) this.contextMenu = null;
			},
			() => {
				if (this.contextMenu == contextMenu) this.contextMenu = null;
			},
		);
	}
}
