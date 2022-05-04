import {
	GuildMember,
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
	MessageSelectMenu,
} from "discord.js";
import { COMMAND, config } from "../../struct";

const cmd: COMMAND = {
	name: "rolestats",
	cooldown: 2,
	example: ["rolestats @roleMention", "rolestats roleID"],
	helpInfo: "Команда для просмотра статистики роли",
	category: "Mod 2",
	permission: "Admin",
	run: async (Client, message, args) => {
		message.delete();

		const members = await message.guild?.members.fetch()!;
		const itemsPerPage = 10;

		let roleMembers: GuildMember[] = [];
		let page = 1;
		let maxPages: number;
		let entrys: GuildMember[] | null = [];

		let navButtons = new MessageActionRow().addComponents([
			new MessageSelectMenu()
				.setCustomId("roleSelect")
				.setPlaceholder("Выбери роль")
				.addOptions(
					message.guild!.roles.cache.map(role => {
						return {
							label: `${role.name}`,
							description: `some desc`,
							value: `${role.id}`,
						};
					})
				),
		]);

		const filter = (interaction: MessageComponentInteraction) => {
			if (interaction.user.id != message.author.id) {
				interaction.reply({
					content: "Вы не вызывали эту команду, поэтому не можете использовать кнопки! ",
					ephemeral: true,
				});

				return false;
			}

			return (
				(["left", "stop", "right", "menu"].includes(interaction.customId) &&
					interaction.isButton()) ||
				(["roleSelect"].includes(interaction.customId) && interaction.isSelectMenu())
			);
		};

		const sentMsg = await message.channel.send({
			content: message.author.toString(),
			components: [navButtons],
		});

		const collector = sentMsg.createMessageComponentCollector({ filter, time: 60000 * 5 });

		const roleStats = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setImage(
				"https://i.pinimg.com/originals/49/03/a3/4903a3afbb583f08ba69cfd96e87cf2b.gif"
			);

		collector.on("collect", interaction => {
			if (interaction.user.id != message.author.id) return;
			if (interaction.isSelectMenu()) {
				const roleId = interaction.values[0];
				const role = message.guild!.roles.cache.get(roleId)!;

				roleMembers = members.filter(member => member.roles.cache.has(roleId)).map(m => m);
				maxPages = Math.ceil(roleMembers.length / itemsPerPage);
				entrys = pages(roleMembers, itemsPerPage, page, maxPages);

				navButtons = new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId("left")
						.setEmoji(config.emojis.LEFTEmoji)
						.setLabel(" ")
						.setStyle("SECONDARY"),
					new MessageButton()
						.setCustomId("stop")
						.setEmoji(config.emojis.CROSS)
						.setLabel(" ")
						.setStyle("DANGER"),
					new MessageButton()
						.setCustomId("right")
						.setLabel(" ")
						.setEmoji(config.emojis.RIGHTEmoji)
						.setStyle("SECONDARY"),
					new MessageButton()
						.setCustomId("menu")
						.setLabel("Меню")
						.setEmoji(config.emojis.ListEmoji)
						.setStyle("SECONDARY"),
				]);

				roleStats
					.setAuthor(
						`Участников с этой ролью: ${roleMembers.length}`,
						message.author.displayAvatarURL({ size: 2048, dynamic: true })
					)
					.setDescription(genDesc(entrys, roleMembers))
					.addFields(
						{
							name: "Цвет",
							value: ` ${role.toString()}\n${role.hexColor}`,
							inline: true,
						},
						{
							name: "Дата создания",
							value: `<t:${(role.createdTimestamp / 1000).toFixed(0)}>`,
							inline: true,
						},
						{
							name: "Можно упоминать?",
							value: role.mentionable ? "Да" : "Нет",
							inline: true,
						}
					);

				interaction.update({
					embeds: [roleStats],
					components: [navButtons],
				});
			} else if (interaction.isButton()) {
				if (interaction.customId === "left") {
					--page;
					if (page < 1) {
						page++;
						return interaction.reply({
							content: `Вы не можете дальше листать. Страницы закончились!`,
							ephemeral: true,
						});
					}
					entrys = pages(roleMembers, itemsPerPage, page, maxPages);
					interaction.update({
						embeds: [roleStats.setDescription(genDesc(entrys!, roleMembers))],
					});
				}
				if (interaction.customId === "right") {
					++page;
					if (page > maxPages) {
						page--;
						return interaction.reply({
							content: `Вы не можете дальше листать. Страницы закончились!`,
							ephemeral: true,
						});
					}
					entrys = pages(roleMembers, itemsPerPage, page, maxPages);
					interaction.update({
						embeds: [roleStats.setDescription(genDesc(entrys!, roleMembers))],
					});
				}

				if (interaction.customId === "stop") {
					collector.stop();
				}

				navButtons = new MessageActionRow().addComponents([
					new MessageSelectMenu()
						.setCustomId("roleSelect")
						.setPlaceholder("Выбери роль")
						.addOptions(
							message.guild!.roles.cache.map(role => {
								return {
									label: `${role.name}`,
									value: `${role.id}`,
								};
							})
						),
				]);

				if (interaction.customId === "menu") {
					page = 1;
					roleStats.fields = [];

					interaction.update({
						embeds: [],
						components: [navButtons],
					});
				}
			}
		});

		collector.on("end", async collected => {
			await sentMsg.delete();
		});
	},
};

function genDesc(entrys: GuildMember[] | null, roleMembers: GuildMember[]) {
	const description = entrys
		?.map(
			member =>
				`\`#${
					roleMembers.findIndex(mem => mem.id === member.id) + 1
				}\` ${member.toString()} (${member.user.tag})`
		)
		.join("\n");
	return description || "Пусто";
}

function pages(arr: GuildMember[], itemsPerPage: number, page: number, maxPages: number) {
	if (page < 1 || page > maxPages) return null;
	return arr.slice((page - 1) * itemsPerPage, page * itemsPerPage);
}

export default cmd;
