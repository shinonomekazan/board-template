import "dotenv/config";
import Driver from "./Driver";
import GitHubDriver from "./GitHubDriver";

export class BoardTemplate {
	readonly driver: Driver;

	constructor(driver: Driver) {
		this.driver = driver;
	}

	async execute() {
		const boardResult = await this.driver.createBoard({
			name: "hoge",
			description: "fuga",
			columns: [
				{
					name: "1st column",
					description: "this is first column",
				},
				{
					name: "2nd column",
				},
				{
					name: "3rd column",
					description: "this is the third column",
				},
			],
		});
		const columnId = boardResult.columnIdMap["1st column"];
		await this.driver.createIssue({
			name: "issue1",
			description: "issue description",
			boardId: boardResult.id,
			columnId: columnId,
		});
	}
}

const driver = new GitHubDriver(
	"shinonomekazan",
	"board-template",
	process.env.GITHUB_TOKEN as string,
);
const boardTemplate = new BoardTemplate(driver);
boardTemplate.execute().then(() => {
	console.log("finished");
}).catch((error) => {
	console.error(error);
});
