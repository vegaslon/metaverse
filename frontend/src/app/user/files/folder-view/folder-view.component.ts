import { Clipboard } from "@angular/cdk/clipboard";
import { isPlatformBrowser } from "@angular/common";
import {
	Component,
	EventEmitter,
	HostListener,
	Inject,
	Input,
	Output,
	PLATFORM_ID,
} from "@angular/core";
import { UtilsService } from "../../../utils.service";
import { File, FilesService, Folder } from "../files.service";

interface ContextMenu {
	type: "file" | "folder";

	file: File;
	folder: Folder;
	x: number;
	y: number;

	urlCopied: boolean;
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

	previewCache = Date.now();

	constructor(
		public readonly utilsService: UtilsService,
		public readonly filesService: FilesService,
		@Inject(PLATFORM_ID) private readonly platformId: any,
		private clipboard: Clipboard,
	) {}

	// TODO: outsource together with files.component.ts
	private getBreadcrumbs(currentFolder: Folder) {
		const breadcrumbs: Folder[] = [];

		while (currentFolder.parent != null) {
			breadcrumbs.unshift(currentFolder);
			currentFolder = currentFolder.parent;
		}

		return breadcrumbs;
	}

	onItemClick(file: File) {
		if (isPlatformBrowser(this.platformId)) window.open(file.url);
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

			urlCopied: false,
			areYouSureDelete: false,
			loading: false,
		};
	}

	@HostListener("window:mousedown", ["$event"])
	private onContextMenuClickAway(e: MouseEvent) {
		if (this.contextMenu == null) return;

		if (
			[...(e as any).path].some((e: HTMLElement) =>
				e.className == undefined
					? false
					: e.className.includes("context-menu"),
			) == false
		)
			this.contextMenu = null;
	}

	onContextMenuCopyUrl() {
		this.clipboard.copy(this.contextMenu.file.url);
		this.contextMenu.urlCopied = true;
		// this.contextMenu = null;
	}

	onContextMenuDownload() {
		this.utilsService.downloadFile(
			this.contextMenu.file.url,
			this.contextMenu.file.name,
		);
		this.contextMenu = null;
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
				: this.filesService.deleteFolder(
						"/" +
							this.getBreadcrumbs(this.contextMenu.folder)
								.map(folder => folder.name)
								.join("/") +
							"/",
				  );

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
