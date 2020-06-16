import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { UserService } from "../../user/user.service";
import { Subscription } from "rxjs";
import { AuthService, User } from "../auth.service";

@Component({
	selector: "app-reset-password",
	templateUrl: "./reset-password.component.html",
	styleUrls: ["./reset-password.component.scss"],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
	user: User;
	complete = false;
	isLoading = false;
	error = "";

	form = new FormGroup(
		{
			newPassword: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
			confirmPassword: new FormControl(null, [Validators.required]),
		},
		(form: FormGroup) => {
			const mismatch =
				form.get("newPassword").value != null &&
				form.get("confirmPassword").value != null &&
				form.get("newPassword").value !==
					form.get("confirmPassword").value;

			return !mismatch
				? null
				: {
						...(mismatch ? { mismatch } : {}),
				  };
		},
	);

	subs: Subscription[] = [];

	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly dialogRef: MatDialogRef<ResetPasswordComponent>,
		@Inject(MAT_DIALOG_DATA) private readonly passwordToken: string,
	) {}

	ngOnInit() {
		this.subs.push(
			this.authService.user$.subscribe(user => {
				this.user = user;
			}),
		);
	}

	ngOnDestroy() {
		for (const sub of this.subs) {
			sub.unsubscribe();
		}
	}

	onSubmit() {
		if (this.form.invalid) return;
		this.isLoading = true;
		this.form.disable();

		this.userService
			.updateUserPassword({
				token: this.passwordToken,
				newPassword: this.form.value.newPassword,
			})
			.subscribe(
				() => {
					this.isLoading = false;
					this.complete = true;
				},
				error => {
					this.error = error;
					this.form.enable();
					this.isLoading = false;
				},
			);
	}

	onClose() {
		this.dialogRef.close();
	}
}
