import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";
import { AuthService, User } from "../../auth/auth.service";
import { UserService } from "../user.service";

@Component({
	selector: "app-settings",
	templateUrl: "./settings.component.html",
	styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit, OnDestroy {
	user: User = {} as User;
	userSub: Subscription = null;

	userImageSrc = "";

	updateUserImage() {
		if (this.user == null) return;
		this.userImageSrc =
			"/api/user/" + this.user.profile.username + "/image?" + +new Date();
	}

	constructor(
		private userService: UserService,
		private authService: AuthService,
		private snackBar: MatSnackBar,
	) {
		this.userSub = this.authService.user$.subscribe(user => {
			this.user = user;
			this.updateUserImage();

			this.emailForm.controls.email.setValue(this.user.profile.email);
		});
	}

	emailForm: FormGroup = new FormGroup({
		email: new FormControl(null, [
			Validators.email,
			Validators.maxLength(64),
		]),
	});
	emailFormError = "";
	emailFormSuccess = "";

	onEmailFormSubmit() {
		if (this.emailForm.invalid) return;

		this.emailForm.disable();

		const sub = this.userService
			.updateUserEmail(this.emailForm.value)
			.subscribe(
				res => {
					this.emailForm.enable();
					this.emailFormSuccess = res.message;
				},
				err => {
					this.emailForm.enable();
					this.emailFormError = err;
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	passwordForm: FormGroup = new FormGroup(
		{
			currentPassword: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
			newPassword: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
			confirmPassword: new FormControl(null, [Validators.required]),
		},
		(form: FormGroup) => {
			const cantBeSame =
				form.get("currentPassword").value != null &&
				form.get("newPassword").value != null &&
				form.get("currentPassword").value ===
					form.get("newPassword").value;

			const mismatch =
				form.get("newPassword").value != null &&
				form.get("confirmPassword").value != null &&
				form.get("newPassword").value !==
					form.get("confirmPassword").value;

			return !cantBeSame && !mismatch
				? null
				: {
						...(cantBeSame ? { cantBeSame } : {}),
						...(mismatch ? { mismatch } : {}),
				  };
		},
	);

	passwordFormError = "";
	passwordFormSuccess = "";

	onPasswordFormSubmit() {
		if (this.passwordForm.invalid) return;

		this.passwordForm.disable();

		const sub = this.userService
			.updateUserPassword({
				currentPassword: this.passwordForm.value.currentPassword,
				newPassword: this.passwordForm.value.newPassword,
			})
			.subscribe(
				res => {
					this.passwordForm.enable();
					this.passwordFormError = "";
					this.passwordFormSuccess = res.message;
				},
				err => {
					this.passwordForm.enable();
					this.passwordFormError = err;
					this.passwordFormSuccess = "";
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	imageForm: FormGroup = new FormGroup({
		image: new FormControl(null, [Validators.required]),
	});
	imageFormError = "";

	onImageFormSubmit() {
		if (this.imageForm.invalid) return;

		this.imageForm.disable();

		const sub = this.userService
			.updateUserImage(this.imageForm.value)
			.subscribe(
				() => {
					this.imageForm.enable();
					this.imageForm.reset();
					this.updateUserImage();

					this.snackBar.open(
						"User image has been updated",
						"Dismiss",
						{
							duration: 2000,
						},
					);
				},
				err => {
					this.imageForm.enable();
					this.imageFormError = err;
				},
				() => {
					sub.unsubscribe();
				},
			);
	}

	ngOnInit() {}

	ngOnDestroy() {
		this.userSub.unsubscribe();
	}
}
