import { Component, Input } from "@angular/core";

@Component({
	selector: "app-user-image",
	templateUrl: "./user-image.component.html",
	styleUrls: ["./user-image.component.scss"],
})
export class UserImageComponent {
	@Input() size = 32;
	@Input() username = "_";
	@Input() online = false;

	constructor() {}
}
