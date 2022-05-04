import { MessageEmbed, Snowflake } from "discord.js";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "avatar",
	cooldown: 2,
	aliases: ["аватар"],
	example: ["avatar", "avatar @mention", "avatar userID"],
	helpInfo: "Команда для просмотра аватара как своего, так и упомянутого пользователя",
	category: "General",
	permission: "User",
	run: async (Client, message, args) => {
		const target = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		const responseEmbed = new MessageEmbed()
			.setImage(
				target?.user.avatarURL({
					size: 4096,
					dynamic: true,
					format: "png",
				})!
			)
			.setColor(message.member?.displayColor!);

		message.channel.send({ content: message.author.toString(), embeds: [responseEmbed] });
	},
};

export default cmd;
