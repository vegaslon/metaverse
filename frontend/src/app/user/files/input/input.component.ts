import {
	Component,
	EventEmitter,
	Inject,
	OnDestroy,
	OnInit,
	Output,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
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

	constructor(
		private readonly dialogRef: MatDialogRef<InputComponent>,
		@Inject(MAT_DIALOG_DATA)
		public readonly data: {
			inputPrefix: string;
			inputDefault: string;
			titleText: string;
			buttonText: string;
			buttonIcon: string;
		},
	) {
		this.form = new FormGroup({
			value: new FormControl(data.inputDefault, [Validators.required]),
		});
	}

	onCancel() {
		this.dialogRef.close();
	}

	sub: Subscription;

	ngOnInit() {
		this.sub = this.onSubmit.subscribe(() => {
			this.loading = true;
		});
	}

	ngOnDestroy() {
		this.sub.unsubscribe();
	}
}
