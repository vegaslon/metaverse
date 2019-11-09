import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "../material.module";
import { ImagePickerComponent } from "./image-picker/image-picker.component";

const components = [ImagePickerComponent];

@NgModule({
	declarations: [...components],
	imports: [CommonModule, MaterialModule, ReactiveFormsModule],
	exports: [...components],
})
export class UiModule {}
