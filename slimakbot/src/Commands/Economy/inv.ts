import { MessageEmbed, Snowflake } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "inv",
	category: "Economy",
	permission: "User",
	cooldown: 2,
	helpInfo: "Команда покажет вам ваш инвентарь, или упомянатого участника",
	example: ["inv", "inv @target", "inv userID"],
	aliases: ["инв", "инвентарь", "$"],
	run: async (Client, message, args) => {
		const member = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		if (member?.user.bot) {
			return util.errorMessage(message, {
				text: "Инвентарь ботов нельзя просмотривать",
				example: true,
				reply: true,
				cmd,
			});
		}

		const user = await userModel.findOne({
			uid: member?.id,
		});

		const invText =
			`\n\n**Осколков**: \`${user?.shards}\` ${config.emojis.SHARDS}` +
			`\n**Капсул**: \`${user?.inventory?.capsuls}\` ${config.emojis.CAPS}` +
			`\n**Частиц**: \`${user?.inventory?.particles}\` ${config.emojis.PART}`;
		const embed = new MessageEmbed()
			.setAuthor(
				`Запросил: ${message.author.tag}`,
				member?.user.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setDescription(`📦 Инвентарь пользователя ${member?.toString()}${invText}`)
			.setColor(member?.displayColor!);
		message.channel.send({ content: message.author.toString(), embeds: [embed] });
	},
};

export default cmd;
