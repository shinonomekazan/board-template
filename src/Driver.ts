import * as types from "./types";

export interface Driver {
	createBoard(params: types.CreateBoardParameters): Promise<types.CreateBoardResult>;
	createIssue(params: types.CreateIssueParameters): Promise<types.CreateIssueResult>;
	getRateLimit(): any;
}

export default Driver;
