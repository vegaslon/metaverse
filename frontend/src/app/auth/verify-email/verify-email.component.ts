import { Component, OnInit, Inject } from "@angular/core";
import { AuthService, User } from "../auth.service";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
	selector: "app-verify-email",
	templateUrl: "./verify-email.component.html",
	styleUrls: ["./verify-email.component.scss"],
})
export class VerifyEmailComponent implements OnInit {
	user: User;
	error = "";

	isLoading = false;
	isSent = false;

	emailForm: FormGroup;

	constructor(
		private authService: AuthService,
		private dialogRef: MatDialogRef<VerifyEmailComponent>,
		@Inject(MAT_DIALOG_DATA) public isVerified: boolean,
	) {}

	ngOnInit() {
		this.authService.user$.subscribe(user => {
			this.user = user;
		});

		this.emailForm = new FormGroup({
			email: new FormControl(this.user.profile.email || "", [
				Validators.required,
				Validators.email,
				Validators.maxLength(64),
			]),
		});
	}

	getEmailDomain() {
		return this.emailForm.value.email.split("@").pop();
	}

	onLogout() {
		this.authService.logout();
		this.dialogRef.close();
	}

	onSendEmail() {
		if (this.emailForm.invalid) return;

		this.isLoading = true;
		this.authService.sendEmailVerify(this.emailForm.value.email).subscribe(
			() => {
				this.error = "";
				this.isLoading = false;
				this.isSent = true;
			},
			err => {
				this.error = err;
				this.isLoading = false;
			},
		);
	}

	onClose() {
		this.dialogRef.close();
	}
}
