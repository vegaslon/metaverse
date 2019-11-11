import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../auth/auth.service";
import { RecaptchaComponent } from "ng-recaptcha";

@Component({
	selector: "app-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnInit {
	errorMessage = "";

	mode: "signIn" | "signUp" | "extSignUp" = "signIn";
	isLoading = false;

	signInForm: FormGroup = null as any;
	signUpForm: FormGroup = null as any;
	extSignUpForm: FormGroup = null as any;

	extServices = ["Google", "Discord", "GitHub"];
	extEmail = "";
	extImageUrl = "";

	@ViewChild("captchaDiv", { static: true }) captchaDiv: ElementRef;
	readonly siteKey = environment.reCaptchaSiteKey;

	constructor(
		public dialogRef: MatDialogRef<SignInComponent>,
		private authService: AuthService,
	) {}

	usernameValidator(control: FormControl): { [s: string]: boolean } | null {
		let value: string = control.value + "";

		if (!/^[a-zA-Z0-9\.\_]+$/.test(value)) return { badCharacters: true };

		if (!/^[^\.\_][a-zA-Z0-9\.\_]*[^\.\_]$/.test(value))
			return { startEndDotUnderscore: true };

		if (value.includes("..") || value.includes("__"))
			return { repeatingDotsUnderscores: true };

		if (value.includes("._") || value.includes("_."))
			return { nextToDotsUnderscores: true };

		return null;
	}

	ngOnInit() {
		setTimeout(() => {
			this.captchaDiv.nativeElement.style.display = "initial";
		}, 250);

		this.signInForm = new FormGroup({
			username: new FormControl(null, [
				Validators.required,
				Validators.minLength(4),
				Validators.maxLength(64), // email too
			]),
			password: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
		});

		this.signUpForm = new FormGroup({
			email: new FormControl(null, [
				Validators.required,
				Validators.email,
				Validators.maxLength(64),
			]),
			username: new FormControl(null, [
				Validators.required,
				this.usernameValidator,
				Validators.minLength(4),
				Validators.maxLength(24),
			]),
			password: new FormControl(null, [
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(64),
			]),
		});

		this.extSignUpForm = new FormGroup({
			username: new FormControl(null, [
				Validators.required,
				this.usernameValidator,
				Validators.minLength(4),
				Validators.maxLength(24),
			]),
			token: new FormControl(null),
			imageUrl: new FormControl(null),
		});
	}

	onSubmit(captcha?: string, captchaRef?: any) {
		let form = null;
		if (this.mode == "signIn") form = this.signInForm;
		if (this.mode == "signUp") form = this.signUpForm;
		if (this.mode == "extSignUp") form = this.extSignUpForm;
		if (form == null) return;
		if (form.invalid) return;

		let service = null;
		if (this.mode == "signIn")
			service = this.authService.signIn({ ...form.value });
		if (this.mode == "signUp")
			service = this.authService.signUp({ ...form.value, captcha });
		if (this.mode == "extSignUp")
			service = this.authService.extSignUp({ ...form.value });
		if (service == null) return;

		this.isLoading = true;
		form.disable();

		const sub = service.subscribe(
			data => {
				this.dialogRef.close();
			},
			err => {
				this.errorMessage = err;
				this.isLoading = false;
				form.enable();

				if (captchaRef)
					(captchaRef.grecaptcha as RecaptchaComponent).reset();
			},
			() => {
				sub.unsubscribe();
			},
		);
	}

	onSignInExt(serviceName: string) {
		const authWindow = window.open(
			(environment.production ? "" : "http://127.0.0.1:3000") +
				"/api/auth/" +
				serviceName,
			"",
			"width=500,height=600,resizable=no",
		);

		this.signInForm.disable();
		this.isLoading = true;

		const interval = setInterval(() => {
			try {
				if (
					authWindow.document.URL.indexOf(
						environment.production
							? window.location.host
							: "127.0.0.1",
					) > -1
				) {
					const tokenStr = authWindow.document.head.querySelector(
						"#token",
					).innerHTML;

					const registerStr = authWindow.document.head.querySelector(
						"#register",
					).innerHTML;

					clearInterval(interval);

					if (tokenStr != "") {
						const token = JSON.parse(tokenStr);

						authWindow.close();
						this.authService.handleAuthentication(token);
						this.dialogRef.close();
					}

					if (registerStr != "") {
						const register = JSON.parse(registerStr) as {
							token: string;
							username: string;
							email: string;
							imageUrl: string;
						};

						authWindow.close();

						this.extSignUpForm.controls.token.setValue(
							register.token,
						);
						this.extSignUpForm.controls.username.setValue(
							register.username,
						);
						if (register.imageUrl)
							this.extSignUpForm.controls.imageUrl.setValue(
								register.imageUrl,
							);

						this.extEmail = register.email;
						this.extImageUrl = register.imageUrl;

						this.isLoading = false;

						this.errorMessage = "";
						this.mode = "extSignUp";
					}
				}
			} catch (err) {}

			try {
				if (authWindow.location.href == undefined) {
					clearInterval(interval);
					this.signInForm.enable();
					this.isLoading = false;
				}
			} catch (err) {}
		}, 100);
	}

	onToggleSignUp() {
		this.errorMessage = "";
		this.mode = this.mode == "signIn" ? "signUp" : "signIn";
	}
}
