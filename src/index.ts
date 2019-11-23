import "dotenv/config";
import * as Octokit from "@octokit/rest";

export interface CreateIssueParameters {
	name: string;
	description?: string;
	assignee?: string;
	labels?: string[];
	boardId: number;
	columnId: number;
}

export interface CreateColumnParameters {
	name: string;
	description?: string;
}

export interface CreateBoardParameters {
	name: string;
	description: string;
	columns?: CreateColumnParameters[];
}

export interface CreateBoardResult {
	id: number;
	columnIdMap: {[key: string]: number};
}

export interface CreateIssueResult {
	id: number;
	issueIdOnBoard: number;
}

export interface Driver {
	createBoard(params: CreateBoardParameters): Promise<CreateBoardResult>;
	createIssue(params: CreateIssueParameters): Promise<CreateIssueResult>;
}

export class GitHubDriver implements Driver {
	readonly owner: string;
	readonly repo: string;
	readonly client: Octokit;

	constructor(owner: string, repo: string, tokenOrClient: string | Octokit) {
		this.owner = owner;
		this.repo = repo;
		if (typeof tokenOrClient === "string") {
			this.client = new Octokit({
				auth: tokenOrClient,
			});
		} else {
			this.client = tokenOrClient;
		}
	}

	async createBoard(params: CreateBoardParameters): Promise<CreateBoardResult> {
		const projectResult = await this.client.projects.createForRepo({
			owner: this.owner,
			repo: this.repo,
			name: params.name,
			body: params.description,
		});
		const result: CreateBoardResult = {
			id: projectResult.data.id,
			columnIdMap: {},
		}
		if (params.columns != null) {
			for (let i = 0; i < params.columns.length; i++) {
				const createColumnParameters = params.columns[i];
				// TODO: implement attach automation
				const columnResult = await this.client.projects.createColumn({
					project_id: result.id,
					name: createColumnParameters.name,
					body: createColumnParameters.description,
				});
				result.columnIdMap[createColumnParameters.name] = columnResult.data.id;
			}
		}
		return result;
	}

	async createIssue(params: CreateIssueParameters): Promise<CreateIssueResult> {
		const issueResult = await this.client.issues.create({
			owner: this.owner,
			repo: this.repo,
			title: params.name,
			body: params.description,
			labels: params.labels,
			assignees: params.assignee == null ? undefined : [params.assignee],
		});
		const cardResult = await this.client.projects.createCard({
			column_id: params.columnId,
			content_id: issueResult.data.id,
			content_type: "Issue",
		});
		return {
			id: issueResult.data.id,
			issueIdOnBoard: cardResult.data.id,
		}
	}
}

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
