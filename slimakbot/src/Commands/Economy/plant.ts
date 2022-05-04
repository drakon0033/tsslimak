import { Message, MessageEmbed, User } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";
import uniqid from "uniqid";

const cmd: COMMAND = {
	name: "plant",
	category: "Economy",
	permission: "User",
	cooldown: 2,
	helpInfo: "Команда что бы выбросить осколки из свои карманов в чат",
	example: ["plant 500"],
	run: async (Client, message, args) => {
		const user = await userModel.findOne({
			uid: message.author.id,
		});

		const amount = Number(args[0]);

		if (!user) {
			return;
		}

		if (!amount || isNaN(amount)) {
			util.errorMessage(message, {
				text: "Вы указали неверное количество",
				reply: true,
			});
			return;
		}

		if (amount > user.shards!) {
			util.errorMessage(message, {
				text: `У вас не хватает осколков на счету, у вас всего: \`${user.shards}\` ${config.emojis.SHARDS}`,
				reply: true,
			});
			return;
		}

		const uniqID = uniqid.time();

		const dropEmbed = new MessageEmbed()
			.setColor("RANDOM")
			.setThumbnail("https://cdn.discordapp.com/emojis/714694360331190312.png?v=1")
			.setDescription(
				`Кто-то выбросил в чат \`${amount}\` осколков!\n\n\nУспейте подобрать их командой \`${config.guildSettings.PREFIX}пик ${uniqID}/${config.guildSettings.PREFIX}pick ${uniqID}\``
			);

		const sentMsg = await message.channel.send({
			embeds: [dropEmbed],
		});

		const filter = (m: Message) =>
			m.author.id != message.author.id &&
			[
				`${config.guildSettings.PREFIX}пик ${uniqID}`,
				`${config.guildSettings.PREFIX}pick ${uniqID}`,
			].includes(m.content);

		await userModel.updateOne(
			{
				uid: message.author.id,
			},
			{
				$inc: {
					shards: -amount,
				},
			}
		);

		message.delete();

		try {
			const collected = await sentMsg.channel.awaitMessages({
				filter,
				max: 1,
				time: 60000 * 5,
				errors: ["time"],
			});

			const winMessage = collected.first();

			const winEmbed = new MessageEmbed()
				.setColor(sentMsg.embeds[0].color!)
				.setDescription(
					`**${winMessage!.author.tag} подбирает себе ${amount} ${config.emojis.SHARDS}**`
				);

			sentMsg.edit({ embeds: [winEmbed] });
			winMessage!.delete();

			await userModel.updateOne(
				{
					uid: winMessage!.author.id,
				},
				{
					$inc: {
						shards: amount,
					},
				}
			);
		} catch (err) {
			await sentMsg.delete();
			await userModel.updateOne(
				{
					uid: message.author.id,
				},
				{
					$inc: {
						shards: amount,
					},
				}
			);
		}
	},
};

export default cmd;
