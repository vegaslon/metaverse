import { Component, Input } from "@angular/core";
import { Folder, FilesService } from "../files.service";
import { formatBytes } from "../../../utils";

@Component({
	selector: "app-tree-item",
	templateUrl: "./tree-item.component.html",
	styleUrls: ["./tree-item.component.scss"],
})
export class TreeItemComponent {
	public formatBytes = formatBytes;

	@Input() folder: Folder;

	collapsed: { [folderName: string]: boolean } = {};
	toggleCollapsed = (folderName: string) =>
		(this.collapsed[folderName] = !this.collapsed[folderName]);

	constructor(public readonly filesService: FilesService) {}
}
