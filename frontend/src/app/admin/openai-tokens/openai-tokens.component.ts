import { Clipboard } from "@angular/cdk/clipboard";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { DeleteConfirmComponent } from "../../ui/delete-confirm/delete-confirm.component";
import { AdminService, OpenaiToken } from "../admin.service";
import { CreateOpenaiTokenComponent } from "../create-openai-token/create-openai-token.component";

@Component({
	selector: "app-openai-tokens",
	templateUrl: "./openai-tokens.component.html",
	styleUrls: ["./openai-tokens.component.scss"],
})
export class OpenaiTokensComponent implements OnInit {
	tokens: OpenaiToken[] = [];

	getDateStringForMonth(monthOffset: number) {
		const date = new Date();
		date.setMonth(date.getMonth() + monthOffset);
		return (
			date.getFullYear() +
			"-" +
			String(date.getMonth() + 1).padStart(2, "0")
		);
	}

	prettyPrintDateString(dateString: string) {
		const [year, month] = dateString.split("-");
		return (
			[
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			][Number(month) - 1] +
			" " +
			year
		);
	}

	getKeys(obj: any) {
		return Object.keys(obj);
	}

	constructor(
		private readonly dialog: MatDialog,
		private readonly adminService: AdminService,
		private readonly clipboard: Clipboard,
	) {}

	refresh() {
		this.adminService.getOpenaiTokens().subscribe(tokens => {
			this.tokens = tokens;
		});
	}

	ngOnInit(): void {
		this.refresh();
	}

	getMonthlyToken(token: OpenaiToken, monthOffset: number) {
		const monthKey = this.getDateStringForMonth(monthOffset);
		const month = token.monthly[monthKey];
		if (month == null) {
			return { tokens: 0, calls: 0 };
		} else {
			return month;
		}
	}

	createToken() {
		const dialog = this.dialog.open(CreateOpenaiTokenComponent, {
			width: "600px",
		});

		dialog.componentInstance.onUpdated.subscribe(() => {
			this.refresh();
		});
	}

	deleteToken(token: OpenaiToken) {
		let dialog = this.dialog.open(DeleteConfirmComponent, {
			data: {
				message:
					"Are you sure you want to delete token " + token.name + "?",
			},
		});

		dialog.componentInstance.deleted.subscribe(() => {
			this.adminService.deleteOpenaiToken(token._id).subscribe(
				() => {
					this.refresh();
				},
				() => {
					this.refresh();
				},
			);
		});
	}

	refreshToken(token: OpenaiToken) {
		let dialog = this.dialog.open(DeleteConfirmComponent, {
			data: {
				yes: "Refresh",
				yesIcon: "refresh",
				message:
					"Are you sure you want to refresh token " +
					token.name +
					"?",
			},
		});

		dialog.componentInstance.deleted.subscribe(() => {
			this.adminService.refreshOpenaiToken(token._id).subscribe(
				() => {
					this.refresh();
				},
				() => {
					this.refresh();
				},
			);
		});
	}

	renameToken(token: OpenaiToken, name: string) {
		this.adminService.renameOpenaiToken(token._id, name).subscribe(
			() => {
				this.refresh();
			},
			() => {
				this.refresh();
			},
		);
	}

	copyToClipboard(token: OpenaiToken) {
		this.clipboard.copy(token.token);
	}
}
