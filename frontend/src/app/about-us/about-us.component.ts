import { HttpClient } from "@angular/common/http";
import { Component, OnInit, Inject, PLATFORM_ID } from "@angular/core";
import { Md5 } from "ts-md5/dist/md5";
import { isPlatformServer } from "@angular/common";

@Component({
	selector: "app-about-us",
	templateUrl: "./about-us.component.html",
	styleUrls: ["./about-us.component.scss"],
})
export class AboutUsComponent implements OnInit {
	constructor(
		private readonly http: HttpClient,
		@Inject(PLATFORM_ID) private readonly platformId: object,
	) {}

	gitContributors: {
		email: string;
		avatarUrl: string;
		commits: number;
	}[] = [];
	gitCommits = 0;

	// this is in no particular order
	contributors: string = "";

	employees: {
		name: string;
		role: string;
		email: string;
		image: string;
		imageStyle?: string;
	}[] = [
		{
			name: "Christina Kinne",
			role: "CMO and events manager",
			email: "xaosprincess@tivolicloud.com",
			image: "cristina.jpg",
			imageStyle: "background-position: 0 center;",
		},
	];

	prettyNumber = (n: number) =>
		Array.from(n.toString())
			.reverse()
			.map((char, i) => char + (i % 3 == 0 && i != 0 ? "," : ""))
			.reverse()
			.join("");

	initials = (name: string) =>
		Array.from(name.slice(0, 2))
			.map((c, i) => (i == 0 ? c.toUpperCase() : c.toLowerCase()))
			.join("");

	shuffleArray = (array: any[]) => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	};

	ngOnInit() {
		if (isPlatformServer(this.platformId)) return;

		this.http
			.get("/assets/contributors/interface-contributors.json")
			.subscribe((contributors: [string, number][]) => {
				for (const contributor of contributors) {
					const email = contributor[0];

					const emailHash = Md5.hashStr(email);

					const avatarUrl =
						"https://www.gravatar.com/avatar/" +
						emailHash +
						"?s=32&d=404";

					const commits = contributor[1];
					this.gitCommits += commits;

					this.gitContributors.push({
						email,
						avatarUrl,
						commits,
					});
				}
			});

		this.http
			.get("/assets/contributors/contributors.json")
			.subscribe((contributors: string[]) => {
				this.contributors = this.shuffleArray(contributors).join(", ");
			});
	}
}
