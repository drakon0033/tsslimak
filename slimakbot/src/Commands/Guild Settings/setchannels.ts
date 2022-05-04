import { COMMAND, config, util } from "../../struct";
import { guildSettings } from "../../db/models/guildSettings";
import { MessageEmbed, Snowflake } from "discord.js";

const cmd: COMMAND = {
	name: "setchannels",
	cooldown: 2,
	example: ["setchannels noXP установить channelID", "setchannels list"],
	helpInfo: "Команда для добавления/удаления каналов в различные списки",
	category: "Guild Settings",
	permission: "Admin",
	advancedInfo: "Доступные списки: `noXP`",
	run: async (Client, message, args) => {
		const types = ["noXP", "list"];
		const action = ["добавить", "удалить"];
		if (!args[0] || !types.includes(args[0])) {
			return util.errorMessage(message, {
				text: `Вы указали неверный тип. Доступные: \`noXP\`, \`list\``,
				reply: true,
			});
		}

		if (args[0] != "list") {
			if (!action.includes(args[1])) {
				return util.errorMessage(message, {
					text: `Вы указали неверное действие`,
					reply: true,
				});
			}
		}

		const gSetts = await util.findOneOrCreate(
			guildSettings,
			{ gid: message.guild!.id },
			{ gid: message.guild?.id }
		);
		switch (args[0]) {
			case "noXP":
				if (!args[2]) {
					return util.errorMessage(message, {
						text: "Вы забыли указать ID канала",
						reply: true,
					});
				}
				let arr = gSetts!.noXPchannels ? gSetts!.noXPchannels.toString().split(/ +/g) : [];
				switch (args[1]) {
					case "добавить":
						if (
							!message.guild!.channels.cache.find(
								ch => ch.type === "GUILD_TEXT" && ch.id === args[2]
							)
						) {
							return util.errorMessage(message, {
								text: "Вам нужно указать действительный ID **ТЕКСТОВОГО** канала",
								reply: true,
							});
						}
						if (arr.includes(args[2])) {
							return util.errorMessage(message, {
								text: "Данный канал уже есть в базе данных",
								reply: true,
							});
						}
						arr.push(args[2]);
						await guildSettings.updateOne(
							{ gid: message.guild!.id },
							{
								noXPchannels: arr.join(" ") as Snowflake,
							}
						);
						message.channel.send(
							`${message.author.toString()}, ${config.emojis.CHECK} Канал <#${
								args[2]
							}> был добавлен в список \`noXP\`. Пользователи не смогут больше получать в нём опыт за сообщения.`
						);
						break;
					case "удалить":
						if (!arr.includes(args[2])) {
							return util.errorMessage(message, {
								text: "Такого канала нет в базе данных",
								reply: true,
							});
						}
						arr = arr.filter(el => el != args[2]);
						await guildSettings.updateOne(
							{ gid: message.guild!.id },
							{
								noXPchannels: arr.join(" ") as Snowflake,
							}
						);
						message.channel.send(
							`${message.author.toString()}, ${config.emojis.CHECK} Канал <#${
								args[2]
							}> был успешно удалён из \`noXP\` списка. Теперь пользователи смогут получать в нём опыт за сообщения.`
						);
						break;
				}
				break;
			case "list":
				if (!gSetts!.noXPchannels) return;
				const embed = new MessageEmbed()
					.setAuthor(
						`Запросил: ${message.author.tag}`,
						message.author.displayAvatarURL({
							size: 2048,
							dynamic: true,
						})
					)
					.setColor(message.member!.displayColor)
					.setDescription(
						`Список каналов в которых пользователи не получают опыт:\n\n${gSetts!.noXPchannels
							.toString()
							.split(/ +/g)
							.map(el => `${el} - <#${el}>`)
							.join("\n")}`
					);
				message.channel.send({ content: message.author.toString(), embeds: [embed] });
				break;
		}
	},
};

export default cmd;
