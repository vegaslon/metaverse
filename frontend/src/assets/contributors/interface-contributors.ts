const childProcess = require("child_process");
const readline = require("readline");
const fs = require("fs");

type Contributor = {
	name: string;
	email: string;
	commits: number;
};

// https://emailregex.com
const emailRegex = () =>
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

function getContributors() {
	return new Promise<Contributor[]>(resolve => {
		const child = childProcess.spawn("/usr/bin/git", ["log"], {
			cwd: "/home/maki/git/tivoli/interface",
			detached: false,
		});

		const rl = readline.createInterface({
			input: child.stdout,
			terminal: false,
			historySize: 0,
		});

		const contributors: Contributor[] = [];

		const findContributor = (email: string) => {
			for (const contributor of contributors) {
				if (email === contributor.email) return contributor;
			}
		};

		rl.on("line", (line: string) => {
			const matches = line.match(/^Author: ([^]+?) <([^]+?)>$/);
			if (matches == null) return;

			const name = matches[1];
			const email = matches[2];

			if (!emailRegex().test(email)) return;

			const contributor = findContributor(email);
			if (contributor == null) {
				contributors.push({
					name,
					email,
					commits: 1,
				});
			} else {
				contributor.commits++;
			}
		});

		child.on("exit", () => {
			resolve(contributors.sort((a, b) => b.commits - a.commits));
		});
	});
}

(async () => {
	const contributors = await getContributors();
	fs.writeFileSync(
		"interface-contributors.json",
		JSON.stringify(contributors.map(c => [c.email, c.commits])),
	);
})();
