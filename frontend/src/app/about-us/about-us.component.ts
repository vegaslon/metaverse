import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { Md5 } from "ts-md5/dist/md5";

@Component({
	selector: "app-about-us",
	templateUrl: "./about-us.component.html",
	styleUrls: ["./about-us.component.scss"],
})
export class AboutUsComponent implements OnInit {
	constructor(private http: HttpClient) {}

	contributors: { email: string; avatarUrl: string; commits: number }[] = [];
	commits = 0;

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

	ngOnInit() {
		const size = 32;

		const sub = this.http.get("/api/interface-contributors.json").subscribe(
			(contributors: [string, number][]) => {
				for (const contributor of contributors) {
					const email = contributor[0];

					const emailHash = Md5.hashStr(email);

					const avatarUrl =
						"https://www.gravatar.com/avatar/" +
						emailHash +
						"?s=32&d=none";

					const commits = contributor[1];
					this.commits += commits;

					this.contributors.push({
						email,
						avatarUrl,
						commits,
					});
				}

				sub.unsubscribe();
			},
			err => {
				sub.unsubscribe();
			},
		);
	}
}
