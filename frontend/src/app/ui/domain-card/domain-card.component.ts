import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Domain } from "../../user/user.service";
import { DomainTokenComponent } from "./domain-token/domain-token.component";

@Component({
	selector: "app-domain-card",
	templateUrl: "./domain-card.component.html",
	styleUrls: ["./domain-card.component.scss"],
})
export class DomainCardComponent implements OnInit {
	@Input() domain: Domain;
	//@Input() refreshImage = false;
	@Input() editMode: boolean;
	@Output() onEdit = new EventEmitter<Domain>();

	thumbnailURL = "";

	inInterface = (window as any).qt != null;

	private displayAmount(thing: string, amount: number): string {
		return amount + " " + (amount == 1 ? thing : thing + "s");
	}

	constructor(private dialog: MatDialog) {}

	ngOnInit() {
		this.thumbnailURL =
			"/api/domain/" + this.domain.id + "/image?" + +new Date();
		//(this.refreshImage ? "?" + +new Date() : "");
	}

	get users(): string {
		if (this.domain.online) {
			return this.displayAmount("user", this.domain.numUsers);
		} else {
			return "Offline";
		}
	}

	onEditDomain() {
		this.onEdit.emit(this.domain);
	}

	onGenerateToken() {
		this.dialog.open(DomainTokenComponent, {
			width: "600px",
			data: this.domain,
		});
	}
}
