import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "../material.module";
import { DomainCardComponent } from "./domain-card/domain-card.component";
import { DomainTokenComponent } from "./domain-card/domain-token/domain-token.component";
import { EditDomainComponent } from "./edit-domain/edit-domain.component";
import { ImagePickerComponent } from "./image-picker/image-picker.component";
import { DeleteConfirmComponent } from "./delete-confirm/delete-confirm.component";

const components = [
	ImagePickerComponent,
	DeleteConfirmComponent,

	DomainCardComponent,
	DomainTokenComponent,
	EditDomainComponent,
];

@NgModule({
	declarations: [...components],
	entryComponents: [
		DomainTokenComponent,
		EditDomainComponent,
		DeleteConfirmComponent,
	],
	imports: [CommonModule, MaterialModule, ReactiveFormsModule],
	exports: [...components],
})
export class UiModule {}
