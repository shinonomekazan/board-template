// 軽く書けるならと書いてみたけどあとで消すかも
export const enum ContentType {
	Empty,
	Content,
	Heading,
	List,
	PrevHeading,
	Pre,
}

interface State {
	type: ContentType;
	body: string[];
	title: string;
	indent: number;
	level?: number;
}

export function parse(data: string) {
	const state: State[] = [];
	let currentState: State | null = null;
	let preMode = false;
	// currentStateがNULLの時に死ぬ
	data.split(/\r\n|\r|\n/g).forEach((line) => {
		if (preMode) {
			currentState!.body.push(parseIndentAndContent(line).content);
			if (isPre(line)) {
				preMode = false;
			}
			return;
		}
		const [type, content, indent, level] = parseLine(line);
		switch (type) {
			case ContentType.Pre:
				currentState!.body.push(content);
				preMode = ! preMode;
				break;
			case ContentType.Empty:
				// 空行無視（ほんとは意味あるけど）
				break;
			case ContentType.Content:
				currentState!.body.push(content);
				break;
			case ContentType.Heading:
				currentState = {
					type,
					level,
					title: content,
					body: [],
					indent,
				};
				state.push(currentState);
				break;
			case ContentType.List:
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

	const root = new Hoge({
		type: ContentType.Heading,
		title: "",
		body: [""],
		indent: 0,
		level: -1,
	});
	let current = root;
	state.forEach((s) => {
		const stateOfHoge = new Hoge(s);
		if (s.type === ContentType.Heading) {
			while (current.type !== ContentType.Heading || s.level! <= current.level!) {
				current = current.parent!;
			}
			current.children.push(stateOfHoge);
			stateOfHoge.parent = current;
			current = stateOfHoge;
		} else if (s.type === ContentType.List) {
			while (current.type === ContentType.List && s.indent <= current.indent) {
				current = current.parent!;
			}
			current.children.push(stateOfHoge);
			stateOfHoge.parent = current;
			current = stateOfHoge;
		}
	});

	return root.children;
}

class Hoge {
	type: ContentType;
	body: string;
	title: string;
	indent: number;
	level?: number;
	children: Hoge[];
	parent?: Hoge;

	constructor(state: State) {
		this.type = state.type;
		this.title = state.title;
		this.body = state.body.join("\n");
		this.indent = state.indent;
		this.level = state.level == null ? undefined : state.level;
		this.children = [];
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
	ContentType, // type
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
		return [ContentType.Empty, line, 0];
	}
	const {indent, content} = parseIndentAndContent(line);

	// ちょっと手抜き
	if (isPre(content)) {
		return [
			ContentType.Pre,
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
			ContentType.Content,
			content,
			indent,
		];
	}
	switch (match[1][0]) {
		case "#":
			return [
				ContentType.Heading,
				match[3],
				indent,
				match[1].length,
			];
		case "-":
			return [
				ContentType.List,
				match[3],
				indent,
			];
		default:
			return [
				ContentType.List,
				match[3],
				indent,
			];
	}
}
