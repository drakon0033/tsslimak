import { COMMAND, config, util } from "../../struct";
import { TextChannel, MessageEmbed } from "discord.js";

const cmd: COMMAND = {
	name: "reactionadd",
	cooldown: 2,
	aliases: ["radd"],
	example: ["radd название реакции ссылка/прикреплённое изображение"],
	helpInfo: "Команда для добавления гифки к реакции",
	category: "Reactions",
	permission: "User",
	run: async (Client, message, args) => {
		const reactionChannel = message.guild?.channels.cache.get(
			config.ids.channelIds.ReactionsRequest
		) as TextChannel;
		const regEx = new RegExp(
			/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
		);

		if (regEx.test(message.content)) {
			const askEmbed = new MessageEmbed()
				.setAuthor(
					message.author.username,
					message.author.displayAvatarURL({
						size: 2048,
						dynamic: true,
					})
				)
				.setColor("#2F3136")
				.setDescription(args[0])
				.setImage(args.slice(1).join(" "));

			reactionChannel.send({
				content: `<@${config.ids.userIds.OWNER_ID}>`,
				embeds: [askEmbed],
			});
		} else if (message.attachments.size) {
			const askEmbed = new MessageEmbed()
				.setAuthor(
					message.author.username,
					message.author.displayAvatarURL({
						size: 2048,
						dynamic: true,
					})
				)
				.setColor("#2F3136")
				.setDescription(args[0])
				.setImage(message.attachments.first()?.url!);

			reactionChannel.send({ embeds: [askEmbed] });
		}

		message.delete();
		message.channel
			.send(`${message.author.toString()}, Заявка успешно отправлена!`)
			.then(m => util.deleteMessage(m, 10000));
	},
};

export default cmd;
