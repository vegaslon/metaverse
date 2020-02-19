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

	ngOnInit() {
		console.log(this.prettyNumber(1));
		console.log(this.prettyNumber(12));
		console.log(this.prettyNumber(123));
		console.log(this.prettyNumber(1234));
		console.log(this.prettyNumber(12345));
		console.log(this.prettyNumber(123456));
		console.log(this.prettyNumber(1234567));

		const size = 32;

		const sub = this.http.get("/api/interface-contributors.json").subscribe(
			(contributors: [string, number][]) => {
				for (const contributor of contributors) {
					const email = contributor[0];

					const emailHash = Md5.hashStr(email);

					const alternateAvatarUrl =
						"https://ui-avatars.com/api/" +
						encodeURIComponent(email.split("@")[0]) +
						"/" +
						size;

					const avatarUrl =
						"https://www.gravatar.com/avatar/" +
						emailHash +
						"?s=32&d=" +
						encodeURIComponent(alternateAvatarUrl);

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
