import { Component, OnInit, EventEmitter } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Domain, UserService } from "../user.service";
import { EditDomainComponent } from "../../ui/edit-domain/edit-domain.component";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
	selector: "app-domains",
	templateUrl: "./domains.component.html",
	styleUrls: ["./domains.component.scss"],
})
export class DomainsComponent implements OnInit {
	domains: Domain[] = [];

	constructor(
		private userService: UserService,
		private dialog: MatDialog,
		private snackBar: MatSnackBar,
	) {
		this.refreshDomains();
	}

	refreshDomains(snackbar = false) {
		const sub = this.userService.getUserDomains().subscribe(
			domains => {
				this.domains = domains;

				if (snackbar)
					this.snackBar.open(
						"Domains have been reloaded",
						"Dismiss",
						{
							duration: 2000,
						},
					);
			},
			err => {},
			() => {
				sub.unsubscribe();
			},
		);
	}

	onCreateDomain() {
		const dialog = this.dialog.open(EditDomainComponent, {
			width: "600px",
		});

		dialog.componentInstance.onUpdated.subscribe(() => {
			this.refreshDomains();
		});
	}

	onEditDomain(domain: Domain) {
		const dialog = this.dialog.open(EditDomainComponent, {
			width: "600px",
			data: domain,
		});

		dialog.componentInstance.onUpdated.subscribe((domain: Domain) => {
			this.refreshDomains();
		});
	}

	ngOnInit() {}
}
