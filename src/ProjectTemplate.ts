import * as fs from "fs";
import * as parser from "./MarkdownParser";
import * as types from "./types";
export class ProjectTemplateLoader {
	readonly projectTemplateFilePath: string;

	constructor(projectTemplateFilePath: string) {
		this.projectTemplateFilePath = projectTemplateFilePath;
	}

	parse(): Promise<types.Template> {
		return new Promise<any>((resolve, reject) => {
			fs.readFile(this.projectTemplateFilePath, {encoding: "utf8"}, (err, data) => {
				if (err) {
					return reject(err);
				}
				const parsed = parser.parse(data);
				resolve(this.blocksToTemplate(parsed));
			});
		});
	}

	blocksToTemplate(blocks: parser.Block[]) {
		const result: types.Template = {
			title: "",
			body: "",
			columns: [] as types.ColumnTemplate[],
		};
		blocks.forEach((block) => {
			if (block.type === parser.BlockType.Heading) {
				if (block.level === 1) {
					result.title = block.title;
					result.body = block.body;
					block.children.forEach((child) => {
						if (child.level === 2) {
							if (child.title === "columns") {
								this.parseColumns(result, child);
							} else if (child.title === "issues") {
								this.parseIssues(result, child);
							}
						}
					});
				}
			}
		});
		return result;
	}

	parseColumns(template: types.Template, block: parser.Block) {
		block.children.forEach((columnBlock) => {
			const [title] = columnBlock.title.split(": ");
			template.columns.push({
				title,
				body: this.createBodyByBlock(columnBlock, false),
				issues: [],
			});
		});
	}

	parseIssues(template: types.Template, block: parser.Block) {
		block.children.forEach((columnBlock) => {
			// これ以外は全無視
			if (columnBlock.type === parser.BlockType.Heading && columnBlock.level === 3) {
				let columnIndex = template.columns.findIndex((column) => column.title === columnBlock.title);
				if (columnIndex === -1) {
					columnIndex = template.columns.length;
					template.columns.push({
						title: columnBlock.title,
						body: "",
						issues: [],
					});
				}
				columnBlock.children.forEach((issueBlock) => {
					const [title] = issueBlock.title.split(": ");
					const issue: types.IssueTemplate = {
						title,
						body: this.createBodyByBlock(issueBlock, true),
					};
					const assignee = this.getAssigneeByBlocks(issueBlock.children);
					const labels = this.getLabelsByBlocks(issueBlock.children);
					if (assignee != null) {
						issue.assignee = assignee;
					}
					if (labels != null && labels.length > 0) {
						issue.labels = labels;
					}
					template.columns[columnIndex].issues.push(issue);
				});
			}
		})
	}

	createBodyByBlock(block: parser.Block, skipLabels: boolean) {
		const splited = block.title.split(": ");
		const bodies: string[] = [];
		if (splited.length > 1 && splited[1].length > 0) {
			bodies.push(splited[1]);
		}
		if (block.body.length > 0) {
			bodies.push(block.body);
		}
		block.children.forEach((descriptions) => {
			if (skipLabels) {
				if (descriptions.title.indexOf(": ") >= 0) {
					return;
				}
			}
			if (descriptions.body.length > 0) {
				bodies.push(`${descriptions.title }\n${descriptions.body}`);
			}
			bodies.push(descriptions.title);
		});
		return bodies.join("\n");
	}

	// createBodyByBodyAndBlocks(body: string | undefined, blocks: parser.Block[], skipLabels: boolean) {
	// 	const bodies: string[] = [];
	// 	blocks.forEach((descriptions) => {
	// 		if (skipLabels) {
	// 			if (descriptions.title.indexOf(": ") >= 0) {
	// 				return;
	// 			}
	// 		}
	// 		if (descriptions.body.length > 0) {
	// 			bodies.push(`${descriptions.title }\n${descriptions.body}`);
	// 		}
	// 		bodies.push(descriptions.title);
	// 	});
	// 	if (body != null && body.length > 0) {
	// 		bodies.push(body);
	// 	}
	// 	return bodies.join("\n");
	// }

	getAssigneeByBlocks(blocks: parser.Block[]) {
		for (let i = 0; i < blocks.length; i++) {
			const [label, value] = blocks[i].title.split(": ")
			if (value != null && value.length > 0 && label === "assignee") {
				return value;
			}
		}
		return undefined;
	}

	getLabelsByBlocks(blocks: parser.Block[]) {
		for (let i = 0; i < blocks.length; i++) {
			const [label, value] = blocks[i].title.split(": ")
			if (value != null && value.length > 0 && label === "labels") {
				return value.split(",").reduce((p, c) => {
					const trimedValue = c.trim();
					if (trimedValue.length > 0) {
						p.push(c);
					}
					return p;
				}, [] as string[]);

			}
		}
		return undefined;
	}
}
