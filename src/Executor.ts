import GitHubDriver from "./GitHubDriver";
import * as types from "./types";

export default class Executor {
	readonly options: types.ExecutorOptions;

	constructor(options: types.ExecutorOptions) {
		this.options = options;
	}

	async execute() {
		if (this.options.driver === "github") {
			return this.executeGitHub(this.options as types.GitHubExecutorOptions);
		}
		throw new Error("Invalid driver");
	}

	async executeGitHub(options: types.GitHubExecutorOptions) {
		const driver = new GitHubDriver(
			options.owner,
			options.repository,
			options.token,
			options.wait,
		);

		if (options.checkRateLimit) {
			const rateLimit = await driver.getRateLimit();
			// TODO: あとで
			if (rateLimit != null) return;
		}

		const boardResult = await driver.createBoard({
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
		await driver.createIssue({
			name: "issue1",
			description: "issue description",
			boardId: boardResult.id,
			columnId: columnId,
		});
	}
}
