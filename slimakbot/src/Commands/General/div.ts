import { MessageEmbed, MessageReaction, User } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "div",
	cooldown: 2,
	aliases: ["расстаться"],
	example: ["div"],
	helpInfo: "Команда что бы расстаться с вашей парой",
	category: "General",
	permission: "User",
	run: async (Client, message, args) => {
		const userData = await userModel.findOne({
			uid: message.author.id,
		});

		if (!userData?.luv) {
			return util.errorMessage(message, {
				text: "У вас нет пары, что бы расставаться.",
				reply: true,
			});
		}

		const CHECK = util.getEmoji(config.emojis.CHECK, Client);
		const CROSS = util.getEmoji(config.emojis.CROSS, Client);
		const emojis = [CHECK?.id, CROSS?.id];

		const filter = (reaction: MessageReaction, user: User) => {
			return user.id === message.author.id && emojis.includes(reaction.emoji.id!);
		};

		const askMessage = await message.channel.send(
			`${message.author.toString()}, вы уверены что хотите расстаться?`
		);

		for (const emoji of emojis) {
			await askMessage.react(emoji!);
		}

		askMessage
			.awaitReactions({ filter, errors: ["time"], max: 1, time: 30000 })
			.then(async collection => {
				const reaction = collection.first();

				if (reaction?.emoji.id === CHECK?.id) {
					await userModel.updateOne(
						{
							uid: userData.luv!,
						},
						{
							luv: null,
						}
					);

					await userModel.updateOne(
						{
							uid: message.author.id,
						},
						{
							luv: null,
						}
					);

					message.member?.roles.remove(config.ids.roleIds.luvRole);
					try {
						const target = await message.guild?.members.fetch(userData.luv!);
						target?.roles.remove(config.ids.roleIds.luvRole);
					} catch (err) {
						util.DiscordErrorHandler(err, {
							cmd,
							message,
						});
					}

					askMessage.edit(`Пара разорвана.`).then(async msg => {
						await askMessage.reactions.removeAll();
						message.delete();
					});
				} else if (reaction?.emoji.id === CROSS?.id) {
					askMessage.edit(`7 раз подумай, 1 раз. . . Откажись.`).then(async msg => {
						await askMessage.reactions.removeAll();
						message.delete();
					});
				}
			})
			.catch(async error => {
				message.delete();
				await askMessage.delete();
			});
	},
};

export default cmd;
