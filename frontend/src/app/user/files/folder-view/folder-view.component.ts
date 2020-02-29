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
import { copyToClipboard, downloadFile } from "src/app/utils";
import { formatBytes } from "../../../utils";
import { File, FilesService, Folder } from "../files.service";

interface ContextMenu {
	file: File;
	x: number;
	y: number;

	copied: boolean;
}

@Component({
	selector: "app-folder-view",
	templateUrl: "./folder-view.component.html",
	styleUrls: ["./folder-view.component.scss"],
})
export class FolderViewComponent {
	public formatBytes = formatBytes;

	@Input() folder: Folder;
	@Output() onFolderClick = new EventEmitter<Folder>();

	constructor(
		public readonly filesService: FilesService,
		@Inject(PLATFORM_ID) private readonly platformId: any,
	) {}

	onItemClick(file: File) {
		if (isPlatformBrowser(this.platformId)) window.open(file.url);
	}

	contextMenu: ContextMenu = null;

	onItemContextMenu(file: File, e: MouseEvent) {
		e.preventDefault();

		this.contextMenu = {
			file,
			x: e.clientX,
			y: e.clientY,

			copied: false,
		};

		console.log(this.contextMenu);
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
		copyToClipboard(this.contextMenu.file.url);
		this.contextMenu.copied = true;
	}

	onContextMenuDownload() {
		downloadFile(this.contextMenu.file.url, this.contextMenu.file.name);
	}
}
