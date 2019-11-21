import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
	selector: "app-delete-confirm",
	templateUrl: "./delete-confirm.component.html",
	styleUrls: ["./delete-confirm.component.scss"],
})
export class DeleteConfirmComponent {
	@Output() deleted = new EventEmitter<void>();

	message: string = "Are you sure you want to delete?";
	yesIcon: string = "delete";
	yes: string = "Delete";
	no: string = "No I dont!";

	constructor(
		public dialogRef: MatDialogRef<DeleteConfirmComponent>,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			message?: string;
			yesIcon?: string;
			yes?: string;
			no?: string;
		},
	) {
		if (data.message) this.message = data.message;
		if (data.yesIcon) this.yesIcon = data.yesIcon;
		if (data.yes) this.yes = data.yes;
		if (data.no) this.no = data.no;
	}
}
