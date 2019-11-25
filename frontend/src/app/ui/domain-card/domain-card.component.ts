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
	domainSettings = "";

	inInterface = (window as any).qt != null;

	private displayAmount(thing: string, amount: number): string {
		return amount + " " + (amount == 1 ? thing : thing + "s");
	}

	constructor(private dialog: MatDialog) {}

	ngOnInit() {
		this.thumbnailURL =
			"/api/domain/" + this.domain.id + "/image?" + +new Date();
		//(this.refreshImage ? "?" + +new Date() : "");

		let domainSettingsHttpPort;
		try {
			domainSettingsHttpPort = parseInt(this.domain.networkPort) - 2;
		} catch (err) {
			domainSettingsHttpPort = 4010;
		}
		this.domainSettings =
			"http://" +
			this.domain.networkAddress +
			":" +
			domainSettingsHttpPort +
			"/settings";
	}

	get users(): string {
		if (this.domain.online) {
			return this.displayAmount("user", this.domain.numUsers);
		} else {
			return "Offline";
		}
	}

	onJoinDomain() {
		if (this.inInterface == false) return;
		const EventBridge = (window as any).EventBridge;

		EventBridge.emitWebEvent(
			JSON.stringify({
				uuid: "com.tivolicloud.explore",
				key: "joinDomain",
				value:
					this.domain.networkAddress +
					":" +
					this.domain.networkPort +
					this.domain.path,
			}),
		);
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
