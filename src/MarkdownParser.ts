// 軽く書けるならと書いてみたけどあとで消すかも
// 特にpre周りの処理がひどい・・
export const enum BlockType {
	Empty,
	Content,
	Heading,
	List,
	PrevHeading,
	Pre,
}

// TODO: このStateはBlockに統一できるので後で統合する
interface State {
	type: BlockType;
	body: string[];
	title: string;
	indent: number;
	level?: number;
}

export class Block {
	type: BlockType;
	body: string;
	title: string;
	indent: number;
	level?: number;
	children: Block[];
	parent?: Block;

	constructor(state: State) {
		this.type = state.type;
		this.title = state.title;
		this.body = state.body.join("\n");
		this.indent = state.indent;
		this.level = state.level == null ? undefined : state.level;
		this.children = [];
	}

	pushToBody(line: string) {
		if (this.body.length > 0) {
			this.body += `\n${line}`;
		} else {
			this.body = line;
		}
	}

	toJSON() {
		return {
			type: this.type,
			body: this.body,
			title: this.title,
			indent: this.indent,
			level: this.level,
			children: this.children,
		};
	}
}

export function parse(data: string): Block[] {
	const state: State[] = [];
	let currentState: State | null = null;
	let preMode = false;
	// TDOO: currentStateがNULLの時に死ぬ（いまいち）
	data.split(/\r\n|\r|\n/g).forEach((line) => {
		if (preMode) {
			if (isPre(line)) {
				preMode = false;
			} else {
				currentState!.body.push(parseIndentAndContent(line).content);
			}
			return;
		}
		const [type, content, indent, level] = parseLine(line);
		switch (type) {
			case BlockType.Pre:
				// currentState!.body.push(content);
				preMode = ! preMode;
				break;
			case BlockType.Empty:
				// 空行はコンテンツが場合に空行挿入
				if (currentState!.body.length > 0) {
					currentState!.body.push("");
				}
				break;
			case BlockType.Content:
				currentState!.body.push(content);
				break;
			case BlockType.Heading:
				currentState = {
					type,
					level,
					title: content,
					body: [],
					indent,
				};
				state.push(currentState);
				break;
			case BlockType.List:
				currentState = {
					type,
					title: content,
					body: [],
					indent,
				};
				state.push(currentState);
				break;
		}
	});

	const root = new Block({
		type: BlockType.Heading,
		title: "",
		body: [""],
		indent: 0,
		level: -1,
	});
	let current = root;
	state.forEach((s) => {
		const stateOfBlock = new Block(s);
		if (s.type === BlockType.Heading) {
			while (current.type !== BlockType.Heading || s.level! <= current.level!) {
				current = current.parent!;
			}
			current.children.push(stateOfBlock);
			stateOfBlock.parent = current;
			current = stateOfBlock;
		} else if (s.type === BlockType.List) {
			while (current.type === BlockType.List && s.indent <= current.indent) {
				current = current.parent!;
			}
			current.children.push(stateOfBlock);
			stateOfBlock.parent = current;
			current = stateOfBlock;
		}
	});

	return root.children;
}

export function parseIndentAndContent(line: string) {
	// スペースとタブが混在でインデントされていても気にしない
	const indentAndContent = line.match(/^(\s+)(\S.+)/s);
	if (indentAndContent == null) {
		// 空白だけだと空白をコンテンツとみなすけど合ってるのかな？
		return {
			indent: 0,
			content: line,
		};
	}
	// ソフトタブのインデントレベルの算出がしんどいけど気にしない
	return {
		indent: indentAndContent[1].length,
		content: indentAndContent[2].trimRight(),
	};
}

export type Line = [
	BlockType, // type
	string,   // content
	number,   // indent
	number?   // level (見出しの時のみ)
];

export function isPre(line: string): boolean {
	return line.trimLeft().indexOf("```") === 0;
}

// ほんとは前行を見ないとわかんないところが多いんだけど
export function parseLine(line: string): Line {
	if (line.length === 0) {
		return [BlockType.Empty, line, 0];
	}
	const {indent, content} = parseIndentAndContent(line);

	// ちょっと手抜き
	if (isPre(content)) {
		return [
			BlockType.Pre,
			content,
			indent,
		];
	}
	// TODO: 前行を見出しにする構文
	switch (content.substr(0, 2)) {
		case "--":
			// h2
			// -- -- とかだとただの線になる
			break;
		case "==":
			// h1
			// == == == とかだとただの文字列になる模様（なぜ？）
			break;
	}

	// 全体的にコンテンツなしブロックは無視する
	const match = content.match(/^([\d]+\.|\-|\#+)(\s+)(\S.+)/s);
	if (match == null) {
		return [
			BlockType.Content,
			content,
			indent,
		];
	}
	switch (match[1][0]) {
		case "#":
			return [
				BlockType.Heading,
				match[3],
				indent,
				match[1].length,
			];
		case "-":
			return [
				BlockType.List,
				match[3],
				indent,
			];
		default:
			return [
				BlockType.List,
				match[3],
				indent,
			];
	}
}
