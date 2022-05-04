import { COMMAND, config, util } from "../../struct";
import { GuildMember, MessageEmbed, Snowflake, TextChannel } from "discord.js";

const cmd: COMMAND = {
	name: "softban",
	cooldown: 2,
	aliases: ["софтбан"],
	example: ["softban userID bad guy"],
	helpInfo: "Команда для бана пользователя которого нет на сервере",
	category: "Mod 1",
	permission: "Admin",
	run: async (Client, message, args) => {
		const ID = args[0] as Snowflake;
		const reason = args.slice(1).join(" ");

		if (!ID || !reason) {
			return util.errorMessage(message, {
				text: "Вы забыли указать `ID` пользователя или причину бана",
				reply: true,
			});
		}
		let target: GuildMember | undefined;
		try {
			target = await message.guild?.members.fetch(ID);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
		}

		const banEmbed = new MessageEmbed()
			.setAuthor(
				message.author.username,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setDescription(
				`Пользователь: ${
					target ? `${target.toString()}(${ID})` : ID
				} был забанен на сервере\nПричина: ${reason}`
			)
			.setColor(message.member?.displayColor!);

		const channel = message.guild?.channels.cache.get(
			config.ids.channelIds.GeneralChat
		) as TextChannel;
		try {
			await message.guild?.members.ban(ID, {
				reason,
			});
			channel
				.send({ embeds: [banEmbed] })
				.then(sentMsg => util.deleteMessage(sentMsg, 15000));
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
		}
	},
};

export default cmd;
