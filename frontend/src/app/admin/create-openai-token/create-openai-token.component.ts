import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { AdminService } from "../admin.service";

@Component({
	selector: "app-create-openai-token",
	templateUrl: "./create-openai-token.component.html",
	styleUrls: ["./create-openai-token.component.scss"],
})
export class CreateOpenaiTokenComponent implements OnInit {
	@Output() onUpdated = new EventEmitter<void>();

	isLoading = false;
	error = "";

	form = new FormGroup({
		name: new FormControl("", [Validators.required]),
	});

	constructor(
		private readonly adminService: AdminService,
		public dialogRef: MatDialogRef<CreateOpenaiTokenComponent>,
	) {}

	ngOnInit(): void {
		if (this.form.invalid) return;

		this.isLoading = true;
		this.form.disable();
	}

	onSubmit() {
		this.adminService.createOpenaiToken(this.form.value.name).subscribe(
			() => {
				this.onUpdated.emit();
				this.dialogRef.close();
			},
			err => {
				this.error = err;
				this.isLoading = false;
				this.form.enable();
			},
		);
	}
}
