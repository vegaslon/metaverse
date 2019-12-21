import { Component, Input } from "@angular/core";

@Component({
	selector: "app-user-image",
	templateUrl: "./user-image.component.html",
	styleUrls: ["./user-image.component.scss"],
})
export class UserImageComponent {
	@Input() width = 32;
	@Input() height = 32;
	@Input() url = "https://alpha.tivolicloud.com/api/user/_/image";
	@Input() online = false;

	constructor() {}
}
