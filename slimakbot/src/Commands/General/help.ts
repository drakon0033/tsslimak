import {
	Message,
	MessageEmbed,
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction,
} from "discord.js";
import { stripIndent } from "common-tags";
import { COMMAND, config, maps, util } from "../../struct";

type CommandMap = { [category: string]: COMMAND[] };
type AllData = { category: string; commands: COMMAND[] }[];

const command: COMMAND = {
	name: "help",
	category: "General",
	helpInfo: "Команда которая отображает помощь по другим командам",
	aliases: ["помощь"],
	permission: "User",
	cooldown: 2,
	example: ["help"],
	run: async (Client, message, args) => {
		message.delete();

		if (args[0]) {
			return message.channel.send({
				content: message.author.toString(),
				embeds: [getCmd(args[0], message)],
			});
		} else {
			const itemsPerPage = 1;
			let page = 1;

			const data: CommandMap = {};
			for (const command of maps.commands.values()) {
				const { category } = command;
				if (data[category]) {
					data[category].push(command);
				} else {
					data[category] = [command];
				}
			}

			let allCommands = Object.entries(data).map(([category, commands]) => ({
				category,
				commands,
			}));
			let filterOptions;

			if (message.author.id === config.ids.userIds.OWNER_ID) {
			} else if (
				message.member?.roles.cache.some(role =>
					config.ids.roleIds.AdminRoles.includes(role.id)
				)
			) {
				filterOptions = cmd => cmd.permission != "Dev";
			} else if (
				message.member?.roles.cache.some(role =>
					config.ids.roleIds.ModeratorRoles.includes(role.id)
				)
			) {
				filterOptions = cmd => ["User", "Moderator"].includes(cmd.permission);
			} else {
				filterOptions = cmd => cmd.permission === "User";
			}

			if (filterOptions) {
				for (const [index, element] of allCommands.entries()) {
					allCommands[index].commands = element.commands.filter(filterOptions);
				}
			}

			allCommands = allCommands.filter(el => el.commands.length);

			const maxPages = Math.ceil(allCommands.length / itemsPerPage);

			const navButtons = new MessageActionRow().addComponents([
				new MessageButton()
					.setCustomId("left")
					.setStyle("PRIMARY")
					.setLabel(" ")
					.setEmoji(config.emojis.LEFTEmoji),
				new MessageButton()
					.setCustomId("stop")
					.setStyle("DANGER")
					.setLabel(" ")
					.setEmoji(config.emojis.CROSS),
				new MessageButton()
					.setCustomId("right")
					.setLabel(" ")
					.setStyle("PRIMARY")
					.setEmoji(config.emojis.RIGHTEmoji),
			]);
			const menuButtons = new MessageActionRow().addComponents([
				new MessageButton()
					.setCustomId("list")
					.setLabel(" ")
					.setEmoji(config.emojis.ListEmoji)
					.setStyle("SUCCESS"),
				new MessageButton()
					.setCustomId("info")
					.setLabel(" ")
					.setEmoji(config.emojis.InfoEmoji)
					.setStyle("SUCCESS"),
				new MessageButton()
					.setLabel(" ")
					.setCustomId("stop")
					.setStyle("DANGER")
					.setEmoji(config.emojis.CROSS),
			]);

			const embed = new MessageEmbed().setTimestamp();
			const msg = await message.channel.send({
				content: message.author.toString(),
				embeds: [
					embed
						.setDescription(
							`Что бы получить список команд нажми на ${config.emojis.ListEmoji}.\nИспользуй стрелки для навигации 👇\n
		${config.emojis.LEFTEmoji} **-** Пролистать назад.
		${config.emojis.RIGHTEmoji} **-** Пролистать вперёд.
		\nНажми на ${config.emojis.InfoEmoji} что бы получить больше информации.\nНажми на ${config.emojis.CROSS} что бы удалить это сообщение.`
						)
						.setColor(message.member!.displayColor),
				],
				components: [menuButtons],
			});

			const filter = (interaction: MessageComponentInteraction) => {
				if (interaction.user.id != message.author.id) {
					interaction.reply({
						content:
							"Вы не вызывали эту команду, поэтому не можете использовать кнопки! ",
						ephemeral: true,
					});

					return false;
				}

				return (
					["left", "stop", "right", "info", "list"].includes(interaction.customId) &&
					interaction.isButton()
				);
			};

			const collector = msg.createMessageComponentCollector({ filter, time: 600000 });

			collector.on("collect", async interaction => {
				if (!interaction.isButton()) return;

				if (interaction.customId === "stop") {
					collector.stop();
				}
				if (interaction.customId === "info") {
					await interaction.update({
						embeds: [
							embed.setDescription(`Если хотите узнать больше информации о команде:\n\`${config.guildSettings.PREFIX}help название команды\`.
							\nПрефикс для этого сервера: \`${config.guildSettings.PREFIX}\`
							\n${config.emojis.InfoEmoji} В некоторых случаях у пользователей кол-во страниц может отличаться - это зависит от прав пользователя на сервере.`),
						],
					});
				}
				if (interaction.customId === "list") {
					const entry = pages(allCommands, itemsPerPage, page, maxPages)![0];

					embed.setAuthor(
						`${page}/${maxPages} | Категория: ${entry.category}`,
						message.guild?.iconURL({
							size: 2048,
							dynamic: true,
						})!
					);
					embed.setDescription(
						entry.commands
							.map(
								cmd =>
									`**${config.guildSettings.PREFIX}${cmd.name}** - ${cmd.helpInfo}`
							)
							.join("\n")
					);
					embed.setFooter(`!help <название команды> что бы узнать больше о ней.`);
					await interaction.update({
						content: message.author.toString(),
						embeds: [embed],
						components: [navButtons],
					});
				}
				if (interaction.customId === "right") {
					page++;
					if (page > maxPages) {
						page--;
						return interaction.reply({
							content: `Вы не можете дальше листать. Страницы закончились!`,
							ephemeral: true,
						});
					}
					const entry = pages(allCommands, itemsPerPage, page, maxPages)![0];

					embed.setAuthor(
						`${page}/${maxPages} | Категория: ${entry.category}`,
						message.guild?.iconURL({
							size: 2048,
							dynamic: true,
						})!
					);
					embed.setDescription(
						entry.commands
							.map(
								cmd =>
									`**${config.guildSettings.PREFIX}${cmd.name}** - ${cmd.helpInfo}`
							)
							.join("\n")
					);
					embed.setFooter(`!help <название команды> что бы узнать больше о ней.`);
					await interaction.update({
						content: message.author.toString(),
						embeds: [embed],
					});
				}
				if (interaction.customId === "left") {
					page--;
					if (page < 1) {
						page = 1;
						return interaction.reply({
							content: `Вы не можете дальше листать. Страницы закончились!`,
							ephemeral: true,
						});
					}

					const entry = pages(allCommands, itemsPerPage, page, maxPages)![0];
					embed.setAuthor(
						`${page}/${maxPages} | Категория: ${entry.category}`,
						message.guild?.iconURL({
							size: 2048,
							dynamic: true,
						})!
					);
					embed.setDescription(
						entry.commands
							.map(
								cmd =>
									`**${config.guildSettings.PREFIX}${cmd.name}** - ${cmd.helpInfo}`
							)
							.join("\n")
					);
					embed.setFooter(`!help <название команды> что бы узнать больше о ней.`);
					await interaction.update({
						content: message.author.toString(),
						embeds: [embed],
					});
				}
			});

			collector.on("end", async collected => {
				await msg.delete();
			});
		}
	},
};

function getCmd(name: string, message: Message) {
	const embed = new MessageEmbed()
		.setAuthor(
			message.author.username,
			message.author.displayAvatarURL({ size: 2048, dynamic: true })
		)
		.setColor(message.member?.displayColor!);

	let command =
		maps.commands.get(name) ||
		maps.commands
			.filter(command => command.aliases != undefined)
			.find(command => command.aliases!.includes(name));
	if (!command) {
		return embed.setDescription(`Команда с названием: \`${name}\` не найдена.`);
	} else {
		const alis = command.aliases ? command.aliases.join(", ") : "`Отсутствуют`";
		const info = stripIndent`**Название команды:** \`${command.name}\`
        **Список алиасов:** \`${alis}\`
        **Описание или доп. инфа:**\n${
			command.advancedInfo ? command.advancedInfo : command.helpInfo
		}
        **Использование команды:**\n${util.cmdExampleToString(command.example, true)}`;
		return embed.setDescription(info);
	}
}

function pages(arr: AllData, itemsPerPage: number, page: number, maxPages: number) {
	if (page < 1 || page > maxPages) return null;
	return arr.slice((page - 1) * itemsPerPage, page * itemsPerPage);
}

export default command;
