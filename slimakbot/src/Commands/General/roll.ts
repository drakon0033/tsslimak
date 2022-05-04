import { MessageEmbed } from "discord.js";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "roll",
	cooldown: 2,
	aliases: ["ролл"],
	example: ["roll"],
	helpInfo: "Команда для ролла рандомного числа от 0 до 100",
	category: "General",
	permission: "User",
	run: async (Client, message, args) => {
		const limit = args[0] ? Number(args[0]) : 100;
		if (!Number.isInteger(limit)) {
			return util.errorMessage(message, {
				text: "Вам нужно указать число",
				reply: true,
			});
		}
		const randomInt = util.randomInt(0, limit);
		const embed = new MessageEmbed()
			.setColor("#2f3136")
			.setAuthor(
				`${message.author.username} roll ${randomInt} point(s)`,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			);
		message.channel.send({ embeds: [embed] });
	},
};

export default cmd;
