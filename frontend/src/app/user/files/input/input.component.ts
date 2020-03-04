import {
	Component,
	EventEmitter,
	Inject,
	OnDestroy,
	OnInit,
	Output,
} from "@angular/core";
import {
	FormControl,
	FormGroup,
	ValidatorFn,
	Validators,
} from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Subscription } from "rxjs";

@Component({
	selector: "app-input",
	templateUrl: "./input.component.html",
	styleUrls: ["./input.component.scss"],
})
export class InputComponent implements OnInit, OnDestroy {
	loading = false;
	@Output() onSubmit: EventEmitter<string> = new EventEmitter();

	form: FormGroup;

	inputPrefix = "";
	inputSuffix = "";

	titleText = "";
	buttonText = "";
	buttonIcon = "";

	constructor(
		private readonly dialogRef: MatDialogRef<InputComponent>,
		@Inject(MAT_DIALOG_DATA)
		private readonly data: {
			inputPrefix: string;
			inputSuffix: string;
			inputDefault: string;

			titleText: string;
			buttonText: string;
			buttonIcon: string;

			validators: ValidatorFn[];
		},
	) {
		if (data.inputPrefix != null) this.inputPrefix = data.inputPrefix;
		if (data.inputSuffix != null) this.inputSuffix = data.inputSuffix;

		if (data.titleText != null) this.titleText = data.titleText;
		if (data.buttonText != null) this.buttonText = data.buttonText;
		if (data.buttonIcon != null) this.buttonIcon = data.buttonIcon;

		this.form = new FormGroup({
			value: new FormControl(data.inputDefault, [
				Validators.required,
				...(data.validators == null ? [] : data.validators),
			]),
		});
	}

	onCancel() {
		this.dialogRef.close();
	}

	private sub: Subscription;

	ngOnInit() {
		this.sub = this.onSubmit.subscribe(() => {
			this.loading = true;
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}
}
