import { MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { COMMAND, config, errorCodes, util } from "../../struct";

const cmd: COMMAND = {
	name: "unban",
	cooldown: 2,
	aliases: ["разбан", "анбан"],
	example: ["unban userID"],
	helpInfo: "Команда для снятия бана с участника",
	category: "Mod 1",
	permission: "Admin",
	run: async (Client, message, args) => {
		const ID = args[0];
		const reason = args.slice(1).join(" ");

		if (!ID || !reason) {
			return util.errorMessage(message, {
				text: "Вы не указали `ID` или причину разбана участника",
				reply: true,
			});
		}

		const embed = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setAuthor(
				Client.user?.username!,
				Client.user?.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.addFields(
				{
					name: "👤 Разбанил",
					value: message.member!.toString(),
					inline: true,
				},
				{ name: "🆔 ID", value: ID, inline: true },
				{ name: "📝 Причина", value: reason, inline: false }
			);
		try {
			await message.guild?.bans.remove(ID as Snowflake, reason);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
			util.errorMessage(message, {
				text: errorCodes[error.code],
				reply: true,
			});
			return;
		}
		message.delete();
		const channel = message.guild?.channels.cache.get(
			config.ids.channelIds.GeneralChat
		) as TextChannel;
		channel.send({ embeds: [embed] }).then(sentMsg => util.deleteMessage(sentMsg, 15000));
	},
};

export default cmd;
