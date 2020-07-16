import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "../material.module";
import { WorldCardComponent } from "./world-card/world-card.component";
import { WorldTokenComponent } from "./world-card/world-token/world-token.component";
import { EditDomainComponent } from "./edit-domain/edit-domain.component";
import { ImagePickerComponent } from "./image-picker/image-picker.component";
import { DeleteConfirmComponent } from "./delete-confirm/delete-confirm.component";
import { UserImageComponent } from "./user-image/user-image.component";

const components = [
	UserImageComponent,
	ImagePickerComponent,
	DeleteConfirmComponent,
	WorldCardComponent,
	WorldTokenComponent,
	EditDomainComponent,
];

@NgModule({
	declarations: [...components],
	entryComponents: [
		WorldTokenComponent,
		EditDomainComponent,
		DeleteConfirmComponent,
	],
	imports: [CommonModule, MaterialModule, ReactiveFormsModule],
	exports: [...components],
})
export class UiModule {}
