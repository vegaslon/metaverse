import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { UtilsService } from "../../../utils.service";
import { UserService } from "../../user.service";

@Component({
	selector: "app-export-data",
	templateUrl: "./export-data.component.html",
	styleUrls: ["./export-data.component.scss"],
})
export class ExportDataComponent implements OnInit {
	constructor(
		private readonly userService: UserService,
		private readonly dialogRef: MatDialogRef<ExportDataComponent>,
		private readonly utilsService: UtilsService,
	) {}

	ngOnInit(): void {}

	error = "";
	form = new FormGroup({
		password: new FormControl(null, [
			Validators.required,
			Validators.minLength(6),
			Validators.maxLength(64),
		]),
	});

	onSubmit() {
		if (this.form.invalid) return;
		this.form.disable();

		this.userService.exportData(this.form.value.password).subscribe(
			blob => {
				this.utilsService.downloadBlob(blob, "tivoli-export-data.zip");
				this.dialogRef.close();
			},
			err => {
				// this.error = err.error.message;
				this.error = "Invalid password";
				this.form.enable();
			},
		);
	}
}
