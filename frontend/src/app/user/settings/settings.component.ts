import { Component, OnInit, OnDestroy } from "@angular/core";
import { User, AuthService } from "../../auth/auth.service";
import { Subscription } from "rxjs";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { UserService } from "../user.service";
import { MatSnackBar } from "@angular/material/snack-bar";

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
			"/api/user/" + this.user.id + "/image?" + +new Date();
	}

	constructor(
		private userService: UserService,
		private authService: AuthService,
		private snackBar: MatSnackBar,
	) {
		this.userSub = this.authService.user.subscribe(user => {
			this.user = user;
			this.updateUserImage();

			this.userForm.controls.email.setValue(this.user.email);
		});
	}

	userForm: FormGroup = new FormGroup({
		email: new FormControl(null, [
			Validators.email,
			Validators.maxLength(64),
		]),
		password: new FormControl(null, [
			Validators.minLength(6),
			Validators.maxLength(64),
		]),
	});
	userFormError = "";

	onUserFormSubmit() {
		if (this.userForm.invalid) return;

		this.userForm.disable();

		const sub = this.userService
			.updateUserDetails(this.userForm.value)
			.subscribe(
				res => {
					this.userForm.enable();

					this.snackBar.open(
						"User details have been updated",
						"Dismiss",
						{
							duration: 2000,
						},
					);
				},
				err => {
					this.userForm.enable();
					this.userFormError = err;
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
