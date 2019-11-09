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

	inSignUpMode = false;
	isLoading = false;

	signInForm: FormGroup = null as any;
	signUpForm: FormGroup = null as any;

	@ViewChild("captchaDiv", { static: true }) captchaDiv: ElementRef;

	//extServices = ["Google", "Discord", "GitHub"];
	extServices = [];

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

		(window as any).testing = this.signInForm;

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
	}

	onSubmit(captcha: string, captchaRef: any) {
		const form = this.inSignUpMode ? this.signUpForm : this.signInForm;
		if (form.invalid) return;

		this.isLoading = true;
		form.disable();

		const sub = (this.inSignUpMode
			? this.authService.signUp({ ...form.value, captcha })
			: this.authService.signIn({ ...form.value, captcha })
		).subscribe(
			data => {
				this.dialogRef.close();
			},
			err => {
				this.errorMessage = err;
				this.isLoading = false;
				form.enable();
				(captchaRef.grecaptcha as RecaptchaComponent).reset();
			},
			() => {
				sub.unsubscribe();
			},
		);
	}

	onSignInExt(serviceName: string) {
		const authWindow = window.open(
			(environment.production ? "" : "http://localhost:3000") +
				"/auth/" +
				serviceName,
			"",
			"width=500,height=600",
		);

		this.signInForm.disable();
		this.isLoading = true;

		const interval = setInterval(() => {
			try {
				if (
					authWindow.document.URL.indexOf(
						environment.production
							? window.location.host
							: "localhost",
					) > -1
				) {
					const token = authWindow.document.head.querySelector(
						"#token",
					).innerHTML;

					clearInterval(interval);

					authWindow.close();
					this.authService.handleAuthentication(token);
					this.dialogRef.close();
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
		this.inSignUpMode = !this.inSignUpMode;
	}
}
