import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Domain } from "../../user/user.service";
import { WorldTokenComponent } from "./world-token/world-token.component";

@Component({
	selector: "app-world-card",
	templateUrl: "./world-card.component.html",
	styleUrls: ["./world-card.component.scss"],
})
export class WorldCardComponent implements OnInit {
	@Input() world: Domain;

	@Input() editMode: boolean;
	@Output() onEdit = new EventEmitter<Domain>();

	thumbnailUrl = "";
	worldSettingsUrl = "";

	constructor(private readonly dialog: MatDialog) {}

	displayPlural(n: number, singular: string, plural?: string) {
		return (
			n +
			" " +
			(n === 1 ? singular : plural != null ? plural : singular + "s")
		);
	}

	ngOnInit() {
		this.thumbnailUrl =
			"/api/domain/" + this.world.id + "/image?" + +new Date();

		let domainSettingsHttpPort;
		try {
			domainSettingsHttpPort = Number(this.world.networkPort) - 2;
		} catch (err) {
			domainSettingsHttpPort = 4010;
		}

		this.worldSettingsUrl =
			"http://" +
			this.world.networkAddress +
			":" +
			domainSettingsHttpPort +
			"/settings";
	}

	get users(): string {
		if (this.world.online) {
			return this.displayPlural(this.world.numUsers, "person", "people");
		} else {
			return "Offline";
		}
	}

	onJoinWorld() {
		// // inInterface = ((window || {}) as any).qt != null;
		// if (this.inInterface == false) return;
		// const EventBridge = (window as any).EventBridge;
		// EventBridge.emitWebEvent(
		// 	JSON.stringify({
		// 		uuid: "com.tivolicloud.explore",
		// 		key: "joinDomain",
		// 		value:
		// 			this.domain.networkAddress +
		// 			":" +
		// 			this.domain.networkPort +
		// 			this.domain.path,
		// 	}),
		// );

		window.open(this.world.url, "_blank");
	}

	onEditWorld() {
		this.onEdit.emit(this.world);
	}

	onGenerateToken() {
		this.dialog.open(WorldTokenComponent, {
			width: "600px",
			data: this.world,
		});
	}
}
