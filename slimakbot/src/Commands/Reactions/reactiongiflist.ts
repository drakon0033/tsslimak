import { MessageEmbed } from "discord.js";
import { Reactions } from "../../db/models/reactions";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "reactiongiflist",
	cooldown: 2,
	aliases: ["rglist"],
	example: ["reactiongiflist reactionName"],
	helpInfo: "Команда которая отобразит каждую гифку у реакции",
	category: "Reactions",
	permission: "Moderator",
	run: async (Client, message, args) => {
		message.delete();
		const reactionName = args[0];
		if (!reactionName) {
			return util.errorMessage(message, {
				text: "Вы не указали название реакции",
				reply: true,
			});
		}

		const reactionData = await Reactions.findOne({
			Name: reactionName,
		});

		if (!reactionData) {
			return util.errorMessage(message, {
				text: "В базе нет реакции с таким названием",
				reply: true,
			});
		}

		if (!reactionData.Gifs?.length) {
			return message
				.reply(`У реакции **${reactionName}** пустой список гифок.`)
				.then(m => util.deleteMessage(m, 5000));
		}

		for (const gif of reactionData.Gifs) {
			const embed = new MessageEmbed()
				.setDescription(gif)
				.setImage(gif)
				.setFooter(`Реакция: ${reactionName}`)
				.setColor(message.member?.displayColor!);

			message.channel.send({ embeds: [embed] });
		}
	},
};

export default cmd;
