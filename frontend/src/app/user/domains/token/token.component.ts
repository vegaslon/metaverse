import { Component, Inject, OnInit } from "@angular/core";
import {
	MatDialog,
	MatDialogRef,
	MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { Domain, UserService } from "../../user.service";

@Component({
	selector: "app-token",
	templateUrl: "./token.component.html",
	styleUrls: ["./token.component.scss"],
})
export class TokenComponent {
	domain: Domain = {} as any;
	loading = false;
	token = "";

	constructor(
		private userService: UserService,
		private dialogRef: MatDialogRef<TokenComponent>,
		@Inject(MAT_DIALOG_DATA) private data: { domain: Domain },
	) {
		this.domain = data.domain;
	}

	onClose() {
		this.dialogRef.close();
	}

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
}
