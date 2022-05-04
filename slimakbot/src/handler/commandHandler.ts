import { Client, ClientEvents } from "discord.js";
import glob from "glob";
import { promisify } from "util";
import { logger } from "../logger";
import { COMMAND, EVENT, maps } from "../struct";

const globAsync = promisify(glob);

export default async (client: Client) => {
	const cmdfiles = await globAsync(`${__dirname}/../Commands/**/*.{js,ts}`);
	const eventfiles = await globAsync(`${__dirname}/../Events/*.{js,ts}`);

	let cmdCount = 0;
	let eventCount = 0;

	for (const file of cmdfiles) {
		const command = (await import(file)).default as COMMAND;

		if (command.name) {
			maps.commands.set(command.name, command);
			cmdCount += 1;
		}
	}

	for (const file of eventfiles) {
		const event = (await import(file)).default as EVENT<keyof ClientEvents>;

		if (event.name) {
			maps.events.push({ ...event });
			eventCount += 1;
		}
	}

	logger.message(
		`\n[ ${cmdCount} - команд было успешно загружено. ]\n[ ${eventCount} - ивентов было успешно загружено. ]`
	);
};
