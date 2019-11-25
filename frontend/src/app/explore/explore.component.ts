import { Component, OnInit } from "@angular/core";
import { ExploreService } from "./explore.service";
import { Domain } from "../user/user.service";

@Component({
	selector: "app-explore",
	templateUrl: "./explore.component.html",
	styleUrls: ["./explore.component.scss"],
})
export class ExploreComponent implements OnInit {
	page = 1;
	domains: Domain[] = [];

	fetchMoreDomains() {
		const sub = this.exploreService
			.findOnlineDomains(this.page, 50)
			.subscribe(
				domains => {
					this.domains = [...this.domains, ...domains];
				},
				err => {},
				() => {
					sub.unsubscribe();
				},
			);

		this.page++;
	}

	constructor(private exploreService: ExploreService) {
		this.fetchMoreDomains();
	}

	ngOnInit() {}
}
