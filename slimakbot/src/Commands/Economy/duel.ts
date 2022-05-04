import { MessageEmbed, MessageReaction, Snowflake, User } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { logger } from "../../logger";
import { COMMAND, config, duelOptions, maps, util } from "../../struct";

const cmd: COMMAND = {
	name: "duel",
	cooldown: 2,
	helpInfo: "Команда для вызова участника на дуэль",
	category: "Economy",
	example: ["duel @target 10", "duel userID 10"],
	aliases: ["дуель", "бой"],
	permission: "User",
	run: async (Client, message, args) => {
		const target = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		const amount = args[1] ? Number(args[1]) : undefined;

		if (target?.id === message.author.id || target?.user.bot) {
			return util.errorMessage(message, {
				text: "Вы не можете вызывать на дуель бота, или самого себя",
				example: true,
				reply: true,
				cmd,
			});
		}

		if (!amount || amount < 10 || amount.toString().startsWith("-")) {
			return util.errorMessage(message, {
				text: "Вам нужно указать правильное число, оно должно быть больше 10",
				reply: true,
				example: true,
				cmd,
			});
		}

		if (
			maps.userInDuel.has(message.author.id) ||
			maps.userInDuel.has(target?.id!) ||
			maps.userInBet.has(message.author.id) ||
			maps.userInBet.has(target?.id!)
		) {
			return util.errorMessage(message, {
				text: "Вам нужно заверишть прошлые ставки или дуели",
				reply: true,
			});
		}

		const targetData = await userModel.findOne({
			uid: target?.id,
		});
		const authorData = await userModel.findOne({
			uid: message.author.id,
		});

		if (targetData?.shards! < amount || authorData?.shards! < amount) {
			return util.errorMessage(message, {
				text: "У вас, или у вашего противника недостаточно осколков на счету",
				reply: true,
			});
		}

		maps.userInDuel.set(message.author.id, undefined);
		maps.userInDuel.set(target?.id!, undefined);

		const duelRequest = new MessageEmbed()
			.setAuthor(`Вызов на дуэль!`, message.guild!.iconURL({ size: 2048 })!)
			.setTimestamp()
			.setColor(message.member!.displayColor)
			.setDescription(
				`На кону **${amount}** осколков!\nУчастник ${message.author.toString()} бросил вызов на дуэль пользователю <@${
					target!.id
				}>.\nИнтересно, как поступит <@${
					target!.id
				}> примет вызов или решит пощадить своего соперника?\n\nЧто бы принять вызов нажмите на ${
					config.emojis.CHECK
				}, для отмены на ${config.emojis.CROSS}.`
			)
			.setFooter(`У вашего опонента есть 1 минута на принятие вызова!`);
		let duelRequestMsg = await message.channel.send({
			content: target!.toString(),
			embeds: [duelRequest],
		});

		const CHECK = util.getEmoji(config.emojis.CHECK, Client);
		const CROSS = util.getEmoji(config.emojis.CROSS, Client);

		const duelOptions: duelOptions = {
			times: 3,
			firstUserCount: 0,
			secondUserCount: 0,
			firstUser: message.member!,
			secondUser: target!,
			amount,
		};

		const emojis = [CHECK?.id, CROSS?.id];

		for (const emote of emojis) {
			await duelRequestMsg.react(emote!);
		}

		const filter = (reaction: MessageReaction, user: User) => {
			return (
				user.id === target?.id &&
				emojis.includes(reaction.emoji.id! || reaction.emoji.name!)
			);
		};

		duelRequestMsg
			.awaitReactions({ filter, max: 1, time: 1000 * 60, errors: ["time"] })
			.then(async collected => {
				const react = collected.first();
				duelRequestMsg.reactions.removeAll();

				if (react?.emoji.id === CHECK?.id || react?.emoji.name === CHECK?.name) {
					const editPage = new MessageEmbed()
						.setAuthor(
							`Дуэль между ${message.author.tag} и ${target!.user.tag}`,
							message.guild!.iconURL({ size: 2048 })!
						)
						.setColor(message.member!.displayColor);

					duelOptions.embedToEdit = editPage;
					duelOptions.msgToEdit = duelRequestMsg;

					let result: duelOptions | undefined;

					result = renderDuel(duelOptions, 1, 2000)!;

					await util.sleep(7000);

					if (!result) return logger.message(`result doesn't found`);

					const winner =
						result?.firstUserCount! > result?.secondUserCount!
							? {
									id: result?.firstUser.id,
									text: `\`${
										result.firstUserCount
									}\` побеждает ${result.firstUser.toString()}`,
							  }
							: {
									id: result?.secondUser.id,
									text: `${
										result.secondUserCount
									} побеждает ${result.secondUser.toString()}`,
							  };
					const losser =
						result?.firstUserCount! > result?.secondUserCount!
							? {
									id: result.secondUser.id,
									text: `проигравший: ${result?.secondUser.toString()}`,
							  }
							: {
									id: result?.firstUser.id,
									text: `проигравший: ${result.firstUser.toString()}`,
							  };
					editPage.setDescription(
						`Со счётом ${winner.text}, ${losser.text}.\n\nПобедитель забирает себе: \`${amount}\` ${config.emojis.SHARDS}`
					);
					duelRequestMsg.edit({ embeds: [editPage] });

					await userModel.updateOne(
						{
							uid: winner.id,
						},
						{
							$inc: {
								shards: amount,
							},
						}
					);

					await userModel.updateOne(
						{
							uid: losser.id,
						},
						{
							$inc: {
								shards: -amount,
							},
						}
					);

					maps.userInDuel.delete(message.author.id);
					maps.userInDuel.delete(target?.id!);
				} else if (react?.emoji.id === CROSS?.id || react?.emoji.name === CROSS?.name) {
					maps.userInDuel.delete(message.author.id);
					maps.userInDuel.delete(target?.id!);
					const requestDenied = new MessageEmbed()
						.setDescription(
							`К сожалению ${target?.toString()} отказался от дуели. Может в другой раз?`
						)
						.setColor(target?.displayColor!);

					duelRequestMsg.edit({
						content: message.author.toString(),
						embeds: [requestDenied],
					});
				}
			})
			.catch(_ => {
				maps.userInDuel.delete(message.author.id);
				maps.userInDuel.delete(target?.id!);
				duelRequestMsg.reactions.removeAll();
				const timeout = new MessageEmbed()
					.setDescription(
						`Спустя минуту ${target?.toString()} так и не принял вызов на дуель.\nПопробуйте вызвать его позже.`
					)
					.setColor(message.member?.displayColor!)
					.setAuthor(
						`Время вышло`,
						message.guild?.iconURL({ dynamic: true, size: 2048 })!
					);

				duelRequestMsg.edit({ content: message.author.toString(), embeds: [timeout] });
			});
	},
};

function renderDuel(options: duelOptions, loop: number, time: number): duelOptions | undefined {
	const randomNumber = util.randomInt(0, 1000);

	if (options.firstUserCount + options.secondUserCount === 3) {
		return options;
	} else {
		if (randomNumber <= 500) {
			options.firstUserCount++;
		} else if (randomNumber >= 500) {
			options.secondUserCount++;
		}

		const firstUser = options.firstUser;
		const secondUser = options.secondUser;
		const roundText = `Раунд: ${loop} из ${options.times}.`;

		const text =
			`${roundText}\nСчёт:` +
			`\n${firstUser!.toString()} - \`${options.firstUserCount}\`.` +
			`\n${secondUser!?.toString()} - \`${options.secondUserCount}\`.` +
			`\n\nДуэль на **${options.amount}** осколков!`;

		setTimeout(() => {
			options.embedToEdit?.setDescription(text);
			options.msgToEdit?.edit({ embeds: [options.embedToEdit!] });
		}, time);
		time += 2000;
		loop += 1;
		return renderDuel(options, loop, time);
	}
}

export default cmd;
