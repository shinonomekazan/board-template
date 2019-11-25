import * as commander from "commander";
import "dotenv/config";
import Executor from "./Executor";
import { GitHubExecutorOptions } from "./types";
import * as templates from "./ProjectTemplate";
import * as readline from "readline";

export async function run(argv: string[]) {
	// Note: あとでdriver option追加してもいい
	commander
		.option("-t, --token <access token>", "GitHub access token")
		.option("-o, --owner <organization or user name>", "GitHub owner")
		.option("-r, --repository <repository name>", "GitHub repository")
		.option("-f, --template-file <path>", "Project template file")
		.option("-p, --project-name <name>", "Project name")
		.option("-w, --wait <wait>", "Wait time per command execution (milliseconds)");
	commander.parse(argv);

	const options: GitHubExecutorOptions = {
		driver: "github",
		checkRateLimit: true,
		token: commander.token || process.env.GITHUB_TOKEN,
		owner: commander.owner || process.env.GITHUB_OWNER,
		repository: commander.repository || process.env.GITHUB_REPOSITORY,
		templateFile: commander.templateFile || process.env.PROJECT_TEMPLATE_FILE,
		projectName: commander.projectName,
		wait: parseInt(commander.wait || process.env.WAIT || 50, 10),
	};

	const prompt = new Prompt();
	try {
		if (! options.token) {
			options.token = await prompt.prompt("token?>");
			if (! options.token) throw new Error("Invalid token");
		}
		if (! options.owner) {
			options.owner = await prompt.prompt("owner?>");
			if (! options.owner) throw new Error("Invalid owner");
		}
		if (! options.repository) {
			options.repository = await prompt.prompt("repository?>");
			if (! options.repository) throw new Error("Invalid repository");
		}
		if (! options.templateFile) {
			options.templateFile = await prompt.prompt("template file?>");
			if (! options.templateFile) throw new Error("Invalid templateFile");
		}
		if (! options.projectName) {
			options.projectName = await prompt.prompt("project name?>");
			if (! options.projectName) throw new Error("Invalid projectName");
		}
	} catch (error) {
		console.error(error);
		process.exit(1);
	} finally {
		prompt.destroy();
	}

	const projectTemplate = new templates.ProjectTemplateLoader(options.templateFile);
	console.log(`create ${options.projectName} to ${options.owner}/${options.repository} by ${options.templateFile}`);
	console.log(`-- wait setting is ${options.wait}`);
	try {
		const template = await projectTemplate.parse()
		const executor = new Executor(options);
		await executor.execute(template);
		console.log("finished");
	} catch (error) {
		console.error(error);
	}
}

class PromiseWrapper {
	resolve: (v: string) => void;
	reject: (error?: Error) => void;

	constructor(resolve: (v: string) => void, reject: (error?: Error) => void) {
		this.resolve = resolve;
		this.reject = reject;
	}
}

class Prompt {
	p: readline.Interface;
	current: PromiseWrapper | null;

	constructor() {
		this.p = readline.createInterface(process.stdin, process.stdout);
		this.p.on("line", this.onLine.bind(this));
		this.p.on("close", this.onClose.bind(this));
		this.current = null;
	}

	prompt(label: string): Promise<string> {
		if (this.current != null) {
			throw new Error("multiple call prompt");
		}
		return new Promise<string>((resolve, reject) => {
			this.current = new PromiseWrapper(
				resolve,
				reject,
			);
			this.p.setPrompt(label);
			this.p.prompt();
		});
	}

	onLine(line: string) {
		if (this.current == null) {
			throw new Error("Invalid prompt status");
		}
		this.current.resolve(line);
	}

	onClose() {
		if (this.current == null) {
			return;
		}
		this.current = null;
	}

	destroy() {
		this.p.close();
	}
}
