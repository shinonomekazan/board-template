import * as fs from "fs";
// import * as markdownIt from "markdown-it";
import * as parser from "./MarkdownParser";

export default class {
	readonly projectTemplateFilePath: string;

	constructor(projectTemplateFilePath: string) {
		this.projectTemplateFilePath = projectTemplateFilePath;
	}

	parse(): Promise<Template> {
		return new Promise<any>((resolve, reject) => {
			fs.readFile(this.projectTemplateFilePath, {encoding: "utf8"}, (err, data) => {
				if (err) {
					return reject(err);
				}
				resolve(parser.parse(data));
			});
		});
	}
}

interface Template {
	title?: string;
	columns: string[];
	issues: string[];
}

