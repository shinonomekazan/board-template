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
