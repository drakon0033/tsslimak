import { Message, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { Reactions } from "../../db/models/reactions";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "reactionapprove",
	cooldown: 2,
	aliases: ["rapprove"],
	example: ["rapprove messageID"],
	helpInfo: "Команда для подтверждения добавления реакции",
	category: "Reactions",
	permission: "Moderator",
	run: async (Client, message, args) => {
		let fetchMessage: Message;
		try {
			const reactionChannel = (await message.guild?.channels.cache.get(
				config.ids.channelIds.ReactionsRequest
			)) as TextChannel;
			fetchMessage = await reactionChannel.messages.fetch(args[0] as Snowflake);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
			return util.errorMessage(message, {
				text: "Не удалось найти сообщения по данному айди",
				reply: true,
			});
		}

		const reactionName = fetchMessage.embeds[0].description!;
		const reactionImage = fetchMessage.embeds[0].image?.url!;

		const reactionEntry = await Reactions.findOne({
			Name: reactionName,
		});

		if (!reactionEntry) {
			await Reactions.create({
				Gifs: [reactionImage],
				Name: reactionName,
			});
			message
				.reply(`Реакция \`${reactionName}\` успешно создана.`)
				.then(m => util.deleteMessage(m, 5000));
			fetchMessage.delete();
		} else {
			const gifsArray = reactionEntry.Gifs;
			if (gifsArray?.includes(reactionImage)) {
				fetchMessage.delete();
				message.delete();
				return util.errorMessage(message, {
					text: "Гиф с такой ссылкой уже существует",
					reply: true,
				});
			}

			gifsArray?.push(reactionImage);
			await Reactions.updateOne(
				{ Name: reactionName },
				{
					Gifs: gifsArray,
				}
			);

			fetchMessage.delete();
			const embed = new MessageEmbed()
				.setDescription(
					`[Гиф](${reactionImage}) успешно добавлена к реакции \`${reactionName}\``
				)
				.setColor(message.member?.displayColor!);
			message.delete();
			message.channel
				.send({ content: message.author.toString(), embeds: [embed] })
				.then(m => util.deleteMessage(m, 5000));
		}
	},
};

export default cmd;
