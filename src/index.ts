import "dotenv/config";
import * as Octokit from "@octokit/rest";

async function hoge() {
	const octokit = new Octokit({
		auth: process.env.GITHUB_TOKEN,
	});
	const result = await octokit.repos.listForOrg({
		org: "shinonomekazan",
		type: "private",
	});
	console.log(result);
}

hoge().then(() => {
	console.log("finished");
}).catch((error) => {
	console.error(error);
});
