import { Component, Input } from "@angular/core";
import { UtilsService } from "../../../utils.service";
import { FilesService, Folder } from "../files.service";

@Component({
	selector: "app-tree-item",
	templateUrl: "./tree-item.component.html",
	styleUrls: ["./tree-item.component.scss"],
})
export class TreeItemComponent {
	@Input() folder: Folder;

	collapsed: { [folderName: string]: boolean } = {};
	toggleCollapsed = (folderName: string) =>
		(this.collapsed[folderName] = !this.collapsed[folderName]);

	constructor(
		public readonly utilsService: UtilsService,
		public readonly filesService: FilesService,
	) {}
}
