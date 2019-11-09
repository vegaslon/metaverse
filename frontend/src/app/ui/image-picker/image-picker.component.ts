import {
	Component,
	ElementRef,
	Input,
	ViewChild,
	forwardRef,
	ChangeDetectorRef,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
	selector: "app-image-picker",
	templateUrl: "./image-picker.component.html",
	styleUrls: ["./image-picker.component.scss"],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => ImagePickerComponent),
			multi: true,
		},
	],
})
export class ImagePickerComponent implements ControlValueAccessor {
	@Input() name = "image";
	@Input() accept = "image/jpeg,image/png";
	@Input() circle = false;
	disabled = false;

	imagePreview = "";

	@ViewChild("imageInput", { static: false }) imageInput: ElementRef;
	onChange: Function = () => {};

	constructor(private ref: ChangeDetectorRef) {}

	onImageChanged(event: any) {
		const input: HTMLInputElement = event.srcElement;
		if (input.files.length == 0) {
			this.onChange(null);
			this.imagePreview = "";
			return;
		}

		const file = input.files[0];
		this.onChange(file);

		// preview
		if (!FileReader) return;
		const reader = new FileReader();
		reader.onload = (e: any) => {
			this.imagePreview = e.target.result;
		};
		reader.readAsDataURL(file);
	}

	onImageClear() {
		this.onChange("");
		this.imageInput.nativeElement.value = "";
		this.imagePreview = "";
	}

	writeValue(value: any) {
		if (this.imageInput == null) return;
		this.imageInput.nativeElement.value = "";
		this.imagePreview = "";
	}

	registerOnChange(fn: Function) {
		this.onChange = fn;
	}

	registerOnTouched(fn: Function) {}

	setDisabledState(isDisabled: boolean) {
		this.disabled = isDisabled;
		this.ref.detectChanges();
	}
}
