import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Domain, UserService } from "../../../user/user.service";
import { Clipboard } from "@angular/cdk/clipboard";

@Component({
	selector: "app-domain-token",
	templateUrl: "./domain-token.component.html",
	styleUrls: ["./domain-token.component.scss"],
})
export class DomainTokenComponent {
	loading = false;
	token = "";
	copied = false;

	constructor(
		private readonly userService: UserService,
		private readonly dialogRef: MatDialogRef<DomainTokenComponent>,
		private readonly clipboard: Clipboard,
		@Inject(MAT_DIALOG_DATA) public readonly domain: Domain,
	) {}

	onGenerateToken() {
		this.loading = true;

		const sub = this.userService
			.generateDomainAccessToken(this.domain.id)
			.subscribe(
				token => {
					this.token = token;
				},
				err => {},
				() => {
					this.loading = false;
					sub.unsubscribe();
				},
			);
	}

	onCopyToClipboard() {
		this.clipboard.copy(this.token);
		this.copied = true;
	}

	onClose() {
		this.dialogRef.close();
	}
}
