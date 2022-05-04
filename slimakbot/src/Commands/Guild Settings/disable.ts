import { disableParts } from "../../db/models/disabledParts";
import { enableParts } from "../../db/models/enabledParts";
import { COMMAND, util, maps, config } from "../../struct";

const cmd: COMMAND = {
	name: "disable",
	cooldown: 2,
	aliases: ["отключить"],
	example: ["disable -l help", "disable General"],
	helpInfo: "Команда для отключения команд/категорий",
	category: "Guild Settings",
	permission: "Admin",
	advancedInfo:
		"Команда для отключения команд/категорий для чатов, или вообще на сервере кроме выделеного канала для команд",
	run: async (Client, message, args) => {
		if (!args[0]) {
			return util.errorMessage(message, {
				text: "Вы забыли указать название команды, либо название категории",
				reply: true,
			});
		}

		let toDisable = maps.commands.get(args[0])
			? maps.commands.get(args[0])?.name
			: maps.commands.find(command => command.category === args[0])
			? maps.commands.find(command => command.category === args[0])?.category
			: undefined;

		const findOption =
			args[1] === "-l"
				? { name: toDisable, channel: message.channel.id }
				: { name: toDisable, channel: null };

		if (await disableParts.findOne(findOption)) {
			return util.errorMessage(message, {
				text: `Данная категория/команда уже выключена`,
				reply: true,
			});
		}
		try {
			await enableParts.deleteOne(findOption);
			await disableParts.create(findOption);
			message.channel.send(
				`${message.author.toString()}, ${config.emojis.CHECK} Категория/команда \`${
					args[0]
				}\` была успешно отключена.`
			);
		} catch {
			util.errorMessage(message, {
				text: `Во время записи в базу данных произошла ошибка`,
				reply: true,
			});
		}
	},
};

export default cmd;
