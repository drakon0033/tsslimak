import { GuildMember, Message, MessageEmbed, MessageReaction, Snowflake, User } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "luv",
	cooldown: 2,
	aliases: ["пара"],
	example: ["luv @mention", "luv userID"],
	helpInfo: "Команда для заключения отношений с участником",
	category: "General",
	permission: "User",
	advancedInfo: `Команда для заключения отношений с участником. Стоимость \`250\` ${config.emojis.SHARDS} для обеих сторон`,
	run: async (Client, message, args) => {
		const member = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		if (member!.id === message.author.id || member!.user.bot) {
			return util.errorMessage(message, {
				text: "Вы не можете заключить отношения сами с собой, либо с ботом",
				reply: true,
			});
		}

		if (
			member!.roles.cache.has(config.ids.roleIds.luvRole) ||
			message.member?.roles.cache.has(config.ids.roleIds.luvRole)
		) {
			return util.errorMessage(message, {
				text: "У вас, или упомянутого участника уже есть пара",
				reply: true,
			});
		}

		const userData = await userModel.findOne({
			uid: message.author.id,
		});
		const targData = await userModel.findOne({
			uid: member!.id,
		});

		if (userData?.shards! < 250 || targData?.shards! < 250) {
			return util.errorMessage(message, {
				text: "У тебя, или участника которому вы предлагаете стать парой, недостаточно осколков",
				reply: true,
			});
		}

		const additionalText = `Что бы согласиться, вам нужно нажать на ♥, для отказа на 💔`;

		const luvAsk = new MessageEmbed()
			.setAuthor(
				message.author.tag,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setColor(message.member?.displayColor!)
			.setDescription(
				`Участник: ${message.author.toString()} предлагает вам стать парой!\n${additionalText}`
			);

		const emojis = ["♥", "💔"];

		let sendedMsg: Message;
		const skyNet = util.getTextChannel(config.ids.channelIds.SkyNet, message.guild!);

		try {
			sendedMsg = await member!.send({ embeds: [luvAsk] });
			message.channel.send(`${message.author.toString()}, Будем ждать ответа..`);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
			sendedMsg = await skyNet.send({ content: member!.toString(), embeds: [luvAsk] });
		}

		for (const emoji of emojis) {
			await sendedMsg.react(emoji);
		}

		const filter = (reaction: MessageReaction, user: User) => {
			return emojis.includes(reaction.emoji.name!) && user.id === member!.id;
		};

		sendedMsg
			.awaitReactions({ filter, max: 1, time: 3600000, errors: ["time"] })
			.then(async collected => {
				const reaction = collected.first();

				switch (reaction?.emoji.name) {
					case "♥":
						const luvAccepted = new MessageEmbed()
							.setAuthor(
								Client.user?.username!,
								Client.user?.displayAvatarURL({
									size: 2048,
									dynamic: true,
								})
							)
							.setDescription(
								`Поздравим новую парочку нашего сервера!\n\n${message.author.toString()} ❤ ${member!.toString()}`
							)
							.setColor(message.member?.displayColor!)
							.setThumbnail("https://i.imgur.com/LJW4XH6.png");
						const generalChat = util.getTextChannel(
							config.ids.channelIds.GeneralChat,
							message.guild!
						);

						generalChat
							.send({
								content: `${message.author.toString()}, ${member!.toString()}`,
								embeds: [luvAccepted],
							})
							.then(m => {
								m.react("🎉");
							});

						message.member?.roles.add(config.ids.roleIds.luvRole);
						member!.roles.add(config.ids.roleIds.luvRole);

						await userModel.updateOne(
							{
								uid: message.member?.id,
							},
							{
								luv: member?.id,
							}
						);

						await userModel.updateOne(
							{
								uid: member?.id,
							},
							{
								luv: message.member?.id,
							}
						);

						withdrawShards(message.member!, member!);
						break;
					case "💔":
						const luvCancelled = new MessageEmbed()
							.setAuthor(
								Client.user?.username!,
								Client.user?.displayAvatarURL({
									size: 2048,
									dynamic: true,
								})
							)
							.setColor(message.member?.displayColor!)
							.setDescription(
								`К сожалению ${member!.toString()} не принял(а) Ваше предложение быть парой. Может в следующий раз?`
							);
						try {
							await message.author.send({ embeds: [luvCancelled] });
						} catch (error) {
							util.DiscordErrorHandler(error, {
								cmd,
								message,
							});
							skyNet.send({
								content: message.author.toString(),
								embeds: [luvCancelled],
							});
						}
						break;
				}
			})
			.catch(error => {
				sendedMsg.channel.send(`Время на принятие решения вышло.`);
			});
	},
};

async function withdrawShards(frst: GuildMember, scnd: GuildMember) {
	await userModel.updateOne(
		{
			uid: frst.id,
		},
		{
			$inc: {
				shards: -250,
			},
		}
	);

	await userModel.updateOne(
		{
			uid: scnd.id,
		},
		{
			$inc: {
				shards: -250,
			},
		}
	);
}

export default cmd;
