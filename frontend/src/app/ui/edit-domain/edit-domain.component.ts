import { Component, Inject, OnInit, Output, EventEmitter } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
	MatDialog,
	MatDialogRef,
	MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { Domain, UserService } from "../../user/user.service";
import { DeleteConfirmComponent } from "../delete-confirm/delete-confirm.component";

@Component({
	selector: "app-edit-domain",
	templateUrl: "./edit-domain.component.html",
	styleUrls: ["./edit-domain.component.scss"],
})
export class EditDomainComponent implements OnInit {
	@Output() onUpdated = new EventEmitter<Domain>();

	isLoading = false;
	editMode = false;
	error = "";

	form: FormGroup = null as any;

	constructor(
		private userService: UserService,
		public dialogRef: MatDialogRef<EditDomainComponent>,
		@Inject(MAT_DIALOG_DATA) public domain: Domain,
		public dialog: MatDialog,
	) {
		this.dialogRef.disableClose = true;
	}

	ngOnInit() {
		if (this.domain) {
			this.editMode = true;
		} else {
			this.domain = {} as Domain;
		}

		this.form = new FormGroup({
			label: new FormControl(this.domain.label || "", [
				Validators.required,
				Validators.minLength(4),
				Validators.maxLength(64),
			]),
			description: new FormControl(this.domain.description || "", [
				Validators.maxLength(8192),
			]),
			// path: new FormControl(this.domain.path || "/0,0,0/0,0,0,0", [
			// 	Validators.required,
			// 	Validators.maxLength(128),
			// ]),
			thumbnail: new FormControl(null),
		});
	}

	onSubmit() {
		if (this.form.invalid) return;

		this.isLoading = true;
		this.form.disable();

		const image = this.form.value.thumbnail;
		delete this.form.value.thumbnail;

		const obs = this.editMode
			? this.userService.updateUserDomain(this.domain.id, this.form.value)
			: this.userService.createUserDomain(this.form.value);

		const sub = obs.subscribe(
			domain => {
				if (image == null) {
					this.onUpdated.emit(domain);
					this.dialogRef.close();
				} else {
					const sub = this.userService
						.updateDomainImage(domain.id, {
							image,
						})
						.subscribe(
							() => {
								this.onUpdated.emit(domain);
								this.dialogRef.close();
							},
							err => {
								this.error = err;
								this.isLoading = false;
								this.form.enable();
							},
							() => {
								sub.unsubscribe();
							},
						);
				}
			},
			err => {
				this.error = err;
				this.isLoading = false;
				this.form.enable();
			},
			() => {
				sub.unsubscribe();
			},
		);
	}

	onDelete() {
		if (!this.editMode) return;
		let dialog = this.dialog.open(DeleteConfirmComponent, {
			data: {
				message:
					"Are you sure you want to delete " +
					this.domain.label +
					"?",
			},
		});

		const sub = dialog.componentInstance.deleted.subscribe(
			() => {
				this.isLoading = true;
				const sub = this.userService
					.deleteUserDomain(this.domain.id)
					.subscribe(
						() => {
							this.onUpdated.emit();
							this.dialogRef.close();
							this.isLoading = false;
						},
						err => {
							this.error = err;
							this.isLoading = false;
						},
						() => {
							sub.unsubscribe();
						},
					);
			},
			() => {},
			() => {
				sub.unsubscribe();
			},
		);
	}

	onDiscard() {
		if (this.form.pristine) return this.dialogRef.close();

		let dialog = this.dialog.open(DeleteConfirmComponent, {
			data: {
				message: "Are you sure you want to discard this domain?",
				yesIcon: "close",
				yes: "Discard",
			},
		});

		const sub = dialog.componentInstance.deleted.subscribe(
			() => {
				this.dialogRef.close();
			},
			() => {},
			() => {
				sub.unsubscribe();
			},
		);
	}
}
