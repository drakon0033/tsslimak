import { MessageEmbed } from "discord.js";
import { Reactions } from "../../db/models/reactions";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "reactioninfo",
	cooldown: 2,
	aliases: ["rinfo"],
	example: ["rinfo reactionName"],
	helpInfo: "Команда для просмотра информации по реакции",
	category: "Reactions",
	permission: "User",
	run: async (Client, message, args) => {
		const name = args[0];

		if (!name) {
			return util.errorMessage(message, {
				text: "Вы забыли указать название реакции",
				reply: true,
			});
		}

		const reaction = await Reactions.findOne({
			Name: name,
		});

		if (!reaction) {
			return util.errorMessage(message, {
				text: `Реакция \`${name}\` не была найдена в базе`,
				reply: true,
			});
		}

		const embedInfo = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setDescription(
				`\\📛 \`Название реакции\`: **${name}**` +
					`\n\\📝 \`Обычный текст\`: ${
						reaction.Text
							? `\n${reaction.Text.replace("%author%", "`%author%`").replace(
									"%target%",
									"`%target%`"
							  )}`
							: `\`Нету\``
					}` +
					`\n\\🛴 \`СолоТекст\`: ${
						reaction.SoloText
							? `\n${reaction.SoloText.replace("%author%", "`%author%`")}`
							: `\`Нету\``
					}`
			);

		message.channel.send({ content: message.author.toString(), embeds: [embedInfo] });
	},
};

export default cmd;
