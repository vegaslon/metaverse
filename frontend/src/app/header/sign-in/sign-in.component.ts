import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AuthService, AuthToken } from "../../auth/auth.service";
import { UtilsService } from "../../utils.service";

@Component({
	selector: "app-sign-in",
	templateUrl: "./sign-in.component.html",
	styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnInit {
	errorMessage = "";

	mode: "signIn" | "signUp" | "extSignUp" | "resetPassword" = "signIn";
	isLoading = false;

	signInForm: FormGroup = null as any;
	signUpForm: FormGroup = null as any;
	extSignUpForm: FormGroup = null as any;
	resetPasswordForm: FormGroup = null as any;

	extServices = ["Google", "Discord", "GitHub"];
	extEmail = "";
	extImageUrl = "";

	resetPasswordSent = false;

	//@ViewChild("captchaDiv", { static: true }) captchaDiv: ElementRef;
	//readonly siteKey = environment.reCaptchaSiteKey;

	constructor(
		public readonly dialogRef: MatDialogRef<SignInComponent>,
		private readonly authService: AuthService,
		@Inject(MAT_DIALOG_DATA)
		private readonly data: {
			mode: "signIn" | "signUp" | "extSignUp";
		},
		public readonly utilsService: UtilsService,
	) {
		if (data != null) {
			if (data.mode != null) this.mode = data.mode;
		}
	}

	usernameValidator(control: FormControl): { [s: string]: boolean } | null {
		let value: string = control.value + "";

		if (!/^[a-zA-Z0-9\_]+$/.test(value)) return { badCharacters: true };

		return null;
	}

	ngOnInit() {
		// setTimeout(() => {
		// 	this.captchaDiv.nativeElement.style.display = "initial";
		// }, 250);

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
				Validators.maxLength(16),
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
				Validators.maxLength(16),
			]),
			token: new FormControl(null),
			imageUrl: new FormControl(null),
		});

		this.resetPasswordForm = new FormGroup({
			email: new FormControl(null, [
				Validators.required,
				Validators.email,
				Validators.maxLength(64),
			]),
		});
	}

	onSubmit(captcha?: string, captchaRef?: any) {
		let form = null;
		if (this.mode === "signIn") form = this.signInForm;
		if (this.mode === "signUp") form = this.signUpForm;
		if (this.mode === "extSignUp") form = this.extSignUpForm;
		if (this.mode === "resetPassword") form = this.resetPasswordForm;
		if (form == null) return;
		if (form.invalid) return;

		let service = null;
		if (this.mode === "signIn")
			service = this.authService.signIn({ ...form.value });
		if (this.mode === "signUp")
			service = this.authService.signUp({ ...form.value });
		if (this.mode === "extSignUp")
			service = this.authService.extSignUp({ ...form.value });
		if (this.mode === "resetPassword")
			service = this.authService.sendResetPassword({ ...form.value });
		if (service == null) return;

		this.isLoading = true;
		form.disable();

		const sub = service.subscribe(
			data => {
				this.errorMessage = "";
				this.isLoading = false;

				if (this.mode === "resetPassword") {
					this.resetPasswordSent = true;
				} else {
					this.dialogRef.close();
				}

				sub.unsubscribe();
			},
			err => {
				this.errorMessage = err;
				this.isLoading = false;
				form.enable();

				//if (captchaRef)
				//	(captchaRef.grecaptcha as RecaptchaComponent).reset();

				sub.unsubscribe();
			},
		);
	}

	onSignInExt(serviceName: string) {
		const authWindow = window.open(
			window.location.origin + "/api/auth/" + serviceName,
			"",
			"toolbar=no,menubar=no,width=500,height=700",
		);

		this.signInForm.disable();
		this.isLoading = true;

		const handleMessage = (e: MessageEvent) => {
			if (e.origin != window.location.origin) return;
			try {
				if (e.data.tivoli != true) return;
			} catch (err) {
				return;
			}

			window.removeEventListener("message", handleMessage);
			authWindow.close();

			const { token, register } = e.data as {
				token: AuthToken;
				register: {
					token: string;
					username: string;
					email: string;
					imageUrl: string;
				};
			};

			if (token != null) {
				this.authService.handleAuthentication(token);
				this.dialogRef.close();
				return;
			}

			if (register != null) {
				this.extSignUpForm.controls.token.setValue(register.token);
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
				return;
			}
		};

		window.addEventListener("message", handleMessage);

		const onClosedInterval = setInterval(() => {
			if (authWindow.closed) {
				clearInterval(onClosedInterval);
				this.signInForm.enable();
				this.isLoading = false;
			}
		}, 100);
	}

	onToggleSignUp() {
		this.errorMessage = "";
		this.mode = this.mode == "signIn" ? "signUp" : "signIn";
	}

	onToggleResetPassword() {
		this.errorMessage = "";
		this.mode = this.mode == "signIn" ? "resetPassword" : "signIn";
	}

	// TODO: put this in utils because its shated
	getEmailDomain(email: string) {
		return email.split("@").pop();
	}
}
