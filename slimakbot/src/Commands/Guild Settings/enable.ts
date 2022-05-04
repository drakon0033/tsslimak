import { disableParts } from "../../db/models/disabledParts";
import { enableParts } from "../../db/models/enabledParts";
import { COMMAND, util, maps, config } from "../../struct";

const cmd: COMMAND = {
	name: "enable",
	cooldown: 2,
	aliases: ["отключить"],
	example: ["enable -l help", "enable General"],
	helpInfo: "Команда для включения команд/категорий",
	category: "Guild Settings",
	permission: "Admin",
	advancedInfo: "Команда для включения команд/категорий для чатов, или вообще на сервере",
	run: async (Client, message, args) => {
		if (!args[0]) {
			return util.errorMessage(message, {
				text: "Вы забыли указать название команды, либо название категории",
				reply: true,
			});
		}

		let toEnable = maps.commands.get(args[0])
			? maps.commands.get(args[0])?.name
			: maps.commands.find(command => command.category === args[0])
			? maps.commands.find(command => command.category === args[0])?.category
			: undefined;

		if (args[1] != "-l") {
			if (!(await disableParts.find({ name: toEnable }))) {
				return util.errorMessage(message, {
					text: `Категория/команда \`${toEnable}\` не выключена`,
					reply: true,
				});
			}
			await enableParts.deleteMany({ name: toEnable });
			await disableParts.deleteMany({ name: toEnable });
			await enableParts.create({ name: toEnable, channel: null });
			return message.channel.send(
				`${message.author.toString()}, ${
					config.emojis.CHECK
				} Команда/категория \`${toEnable}\` была успешно включена.`
			);
		} else {
			await disableParts.deleteOne({
				name: toEnable,
				channel: message.channel.id,
			});
			await enableParts.create({
				name: toEnable,
				channel: message.channel.id,
			});
			return message.channel.send(
				`${message.author.toString()}, ${
					config.emojis.CHECK
				} Команда/категория \`${toEnable}\` была успешно включена для канала ${message.channel.toString()}`
			);
		}
	},
};

export default cmd;
