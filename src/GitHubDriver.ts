import * as types from "./types";
import Driver from "./Driver";
import * as Octokit from "@octokit/rest";

export default class implements Driver {
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

	async createBoard(params: types.CreateBoardParameters): Promise<types.CreateBoardResult> {
		const projectResult = await this.client.projects.createForRepo({
			owner: this.owner,
			repo: this.repo,
			name: params.name,
			body: params.description,
		});
		const result: types.CreateBoardResult = {
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

	async createIssue(params: types.CreateIssueParameters): Promise<types.CreateIssueResult> {
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
