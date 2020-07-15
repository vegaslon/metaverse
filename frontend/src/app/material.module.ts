import { MdcCheckboxModule } from "@angular-mdc/web/checkbox";
import { MDCDataTableModule } from "@angular-mdc/web/data-table";
import { MdcFormFieldModule } from "@angular-mdc/web/form-field";
import { MdcTextFieldModule } from "@angular-mdc/web/textfield";
import { NgModule } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTableModule } from "@angular/material/table";
import { MatTabsModule } from "@angular/material/tabs";
import { MatToolbarModule } from "@angular/material/toolbar";

const modules = [
	MatButtonModule,
	MatCardModule,
	MatDialogModule,
	MatDividerModule,
	MatFormFieldModule,
	MatIconModule,
	MatInputModule,
	MatMenuModule,
	MatProgressBarModule,
	MatProgressSpinnerModule,
	MatSlideToggleModule,
	MatSnackBarModule,
	MatTableModule,
	MatTabsModule,
	MatToolbarModule,

	MdcCheckboxModule,
	MDCDataTableModule,
	MdcFormFieldModule,
	MdcTextFieldModule,
];

@NgModule({
	imports: [...modules],
	exports: [...modules],
})
export class MaterialModule {}
