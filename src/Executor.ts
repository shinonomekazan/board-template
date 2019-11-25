import GitHubDriver from "./GitHubDriver";
import * as types from "./types";

export default class Executor {
	readonly options: types.ExecutorOptions;

	constructor(options: types.ExecutorOptions) {
		this.options = options;
	}

	async execute(template: types.Template) {
		if (this.options.driver === "github") {
			return this.executeGitHub(
				template,
				this.options as types.GitHubExecutorOptions,
			);
		}
		throw new Error("Invalid driver");
	}

	async executeGitHub(template: types.Template, options: types.GitHubExecutorOptions) {
		const driver = new GitHubDriver(
			options.owner,
			options.repository,
			options.token,
			options.wait,
		);

		if (options.checkRateLimit) {
			const rateLimit = await driver.getRateLimit();
			console.log("dump rate limit", rateLimit);
		}

		console.log("creating board...");
		const boardResult = await driver.createBoard({
			name: options.projectName || template.title,
			description: template.body,
			columns: template.columns.map((column) => ({
				name: column.title,
				description: column.body,
			})),
		});
		console.log("- created.");

		console.log("creating issues...");
		// 直列実行のために一度並列展開してからやる
		const createIssueParameters = template.columns.reduce((p, column) => {
			const columnId = boardResult.columnIdMap[column.title];
			return p.concat(column.issues.map((issue) => ({
				name: issue.title,
				description: issue.body,
				boardId: boardResult.id,
				columnId,
				assignee: issue.assignee,
				labels: issue.labels,
			})));
		}, [] as types.CreateIssueParameters[]);
		for (let i = 0; i < createIssueParameters.length; i++) {
			await driver.createIssue(createIssueParameters[i]);
			console.log(`- created: ${createIssueParameters[i].name}`);
		}
	}
}
