import { Component, OnInit } from "@angular/core";
import { Domain, UserService } from "../user.service";
import { MatDialog } from "@angular/material/dialog";
import { DomainTokenComponent } from "./domain-token/domain-token.component";

@Component({
	selector: "app-domains",
	templateUrl: "./domains.component.html",
	styleUrls: ["./domains.component.scss"],
})
export class DomainsComponent implements OnInit {
	domains: Domain[] = [];

	refreshDomains() {
		const sub = this.userService.getUserDomains().subscribe(
			domains => {
				this.domains = domains;
			},
			err => {},
			() => {
				sub.unsubscribe();
			},
		);
	}

	constructor(private userService: UserService, private dialog: MatDialog) {
		this.refreshDomains();
	}

	onGenerateToken(domain: Domain) {
		this.dialog.open(DomainTokenComponent, {
			width: "600px",
			data: {
				domain,
			},
		});
	}

	ngOnInit() {}
}
