import {
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
	MessageReaction,
	User,
} from "discord.js";
import { Reactions } from "../../db/models/reactions";
import { IReactions } from "../../db/types/reactions";
import { COMMAND, config, util } from "../../struct";
import utils from "../../util";

const cmd: COMMAND = {
	name: "reactionlist",
	cooldown: 2,
	aliases: ["rlist"],
	example: ["rlist"],
	helpInfo: "Команда для просмотра списка реакций",
	category: "Reactions",
	permission: "User",
	run: async (Client, message, args) => {
		const reactions = await Reactions.find();
		const itemsOnPage = 6;
		let page = 1;
		let array: IReactions[];
		const maxPages = Math.ceil(reactions.length / itemsOnPage);

		message.delete();

		if (!reactions.length) {
			const errorEmbed = new MessageEmbed()
				.setAuthor(
					message.author.username,
					message.author.displayAvatarURL({
						size: 2048,
						dynamic: true,
					})
				)
				.setColor("RANDOM")
				.setDescription("Список реакций пуст");
			return message.channel.send({
				content: message.author.toString(),
				embeds: [errorEmbed],
			});
		}

		let embed = new MessageEmbed()
			.setAuthor(
				message.author.username,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setColor("DARK_BUT_NOT_BLACK")
			.setTitle(`Список реакций`)
			.setFooter(
				`Страница: ${page} из ${maxPages} | 📷 - список гифок пуст. ✍ - у реакции нет текста.`
			);

		reactions.slice(0, itemsOnPage).map(entry => {
			let gifInfo = entry.Gifs?.length ? "" : `\\📷 - ${config.emojis.CROSS}`;
			gifInfo += entry.Text || entry.SoloText ? "" : `\\✍ - ${config.emojis.CROSS}`;
			embed.addField(entry.Name!, gifInfo ? gifInfo : config.emojis.CHECK, true);
		});

		const navButtons = new MessageActionRow().addComponents([
			new MessageButton()
				.setCustomId("left")
				.setLabel(" ")
				.setEmoji(config.emojis.LEFTEmoji)
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("stop")
				.setLabel(" ")
				.setEmoji(config.emojis.CROSS)
				.setStyle("DANGER"),
			new MessageButton()
				.setCustomId("right")
				.setLabel(" ")
				.setEmoji(config.emojis.RIGHTEmoji)
				.setStyle("PRIMARY"),
		]);

		const msg = await message.channel.send({
			content: message.author.toString(),
			embeds: [embed],
			components: [navButtons],
		});

		const filter = (interaction: MessageComponentInteraction) => {
			if (interaction.user.id != message.author.id) {
				interaction.reply({
					content: "Вы не вызывали эту команду, поэтому не можете использовать кнопки! ",
					ephemeral: true,
				});

				return false;
			}

			return (
				["left", "stop", "right"].includes(interaction.customId) && interaction.isButton()
			);
		};

		const collector = msg.createMessageComponentCollector({ filter, time: 300000 });

		collector.on("collect", async react => {
			if (react.customId === "left") {
				page--;

				if (page < 1) {
					page = 1;
					return react.reply({
						content: `Вы не можете дальше листать. Страницы закончились!`,
						ephemeral: true,
					});
				}

				array = pages(reactions, itemsOnPage, page, maxPages)!;

				if (!array) {
					return;
				}

				msg.embeds[0].fields = [];
				embed = msg.embeds[0];
				array.map(entry => {
					let gifInfo = entry.Gifs?.length ? "" : `\\📷 - ${config.emojis.CROSS}`;
					gifInfo += entry.Text || entry.SoloText ? "" : `\\✍ - ${config.emojis.CROSS}`;
					embed.addField(entry.Name!, gifInfo ? gifInfo : config.emojis.CHECK, true);
				});
				embed.setFooter(
					`Страница: ${page} из ${maxPages} | 📷 - список гифок пуст. ✍ - у реакции нет текста.`
				);
				react.update({ embeds: [embed] });
			}

			if (react.customId === "right") {
				page++;
				if (page > maxPages) {
					page--;
					return react.reply({
						content: `Вы не можете дальше листать. Страницы закончились!`,
						ephemeral: true,
					});
				}
				array = pages(reactions, itemsOnPage, page, maxPages)!;

				if (!array) {
					return;
				}

				msg.embeds[0].fields = [];
				embed = msg.embeds[0];
				array.map(entry => {
					let gifInfo = entry.Gifs?.length ? "" : `\\📷 - ${config.emojis.CROSS}`;
					gifInfo += entry.Text || entry.SoloText ? "" : `\\✍ - ${config.emojis.CROSS}`;
					embed.addField(entry.Name!, gifInfo ? gifInfo : config.emojis.CHECK, true);
				});

				embed.setFooter(
					`Страница: ${page} из ${maxPages} | 📷 - список гифок пуст. ✍ - у реакции нет текста.`
				);
				react.update({ embeds: [embed] });
			}

			if (react.customId === "stop") {
				collector.stop();
			}
		});

		collector.on("end", async collected => {
			await msg.delete();
		});
	},
};

function pages(arr: IReactions[], itemsPerPage: number, page: number, maxPages: number) {
	if (page < 1 || page > maxPages) return null;
	return arr.slice((page - 1) * itemsPerPage, page * itemsPerPage);
}

export default cmd;
