import { ColorResolvable, Message, MessageEmbed, Snowflake, TextChannel, Util } from "discord.js";
import { reactionRolesModel } from "../../db/models/reactionRoles";
import { IReactionRoles } from "../../db/types/reactionRoles";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "reactionroles",
	cooldown: 2,
	example: [
		"reactionroles set channelID messageID reaction roleID",
		"reactionroles remove channelID messageID reaction",
	],
	helpInfo: "Команда для установки/удаления авто-выдачи ролей по реакциям",
	category: "Guild Settings",
	permission: "Admin",
	run: async (Client, message, args) => {
		let action = args[0];
		let channelID = args[1] as Snowflake;
		let messageID = args[2] as Snowflake;
		let reaction = args[3];

		if (!action || !["set", "remove", "addrole", "removerole", "info"].includes(action)) {
			return util.errorMessage(message, {
				text: "Вы указали неверное действие, доступные: `set, remove, addrole, removerole, info`",
				reply: true,
			});
		}

		if (!channelID) {
			return util.errorMessage(message, {
				text: "Вы забыли указать айди канала",
				reply: true,
			});
		}

		if (channelID === "-") {
			channelID = message.channel.id;
		}

		if (
			!message.guild?.channels.cache.has(channelID) ||
			message.guild?.channels.cache.get(channelID)?.type != "GUILD_TEXT"
		) {
			return util.errorMessage(message, {
				text: "Вы указали неверный **текстовый** канал сервера",
				reply: true,
			});
		}

		let actualMessage: Message;
		const channel = message.guild.channels.cache.get(channelID) as TextChannel;

		try {
			actualMessage = await channel.messages.fetch(messageID);
		} catch (err) {
			return util.errorMessage(message, {
				text: `В канале ${channelID.toString()} нет сообщения с **ID**: \`${messageID}\``,
				reply: true,
			});
		}

		const emoji = Util.parseEmoji(reaction);

		if (emoji?.id) {
			if (!Client.emojis.cache.some(em => em.id === emoji.id)) {
				return util.errorMessage(message, {
					text: "К сожалению этой реакции нет на этом сервере, укажите другую",
					reply: true,
				});
			}
		}

		const answerEmbed = new MessageEmbed()
			.setColor(config.colors.embedBlankColor as ColorResolvable)
			.setAuthor(
				message.author.username,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			);

		let alreadyExist: IReactionRoles | null;

		if (reaction.startsWith("\\")) {
			reaction = reaction.slice(1, reaction.length);
		}

		if (action != "set") {
			alreadyExist = await reactionRolesModel.findOne({
				channelID,
				messageID,
				reaction,
			});

			if (!alreadyExist) {
				return util.errorMessage(message, {
					text: `У [сообщения](${
						actualMessage.url
					}) в канале ${channel.toString()} нет реакции ${reaction}`,
					reply: true,
				});
			}
		}

		let roles: string[] = [];

		switch (action) {
			case "set":
				alreadyExist = await reactionRolesModel.findOne({
					messageID,
					channelID,
					reaction,
				});

				if (alreadyExist) {
					return util.errorMessage(message, {
						text: `Реакция ${reaction} уже существует для сообщения \`${messageID}\` в канале ${channel.toString()}`,
						reply: true,
					});
				}

				if (!message.mentions.roles.size && args.length < 4) {
					return util.errorMessage(message, {
						text: "Вы не указали роль, или список ролей которые будут выдаваться при реакции",
						reply: true,
					});
				}

				roles = message.mentions.roles.size
					? message.mentions.roles.map(r => r.id)
					: args.length > 4
					? args.slice(4, args.length)
					: [args[4]];

				for (const role of roles) {
					if (!message.guild.roles.cache.has(role as Snowflake)) {
						util.errorMessage(message, {
							text: `Роль с **ID** \`${role}\` не найдена на сервере. Запустите команду еще раз, указав правильную роль/роли`,
							reply: true,
						});
						break;
					}
				}

				await reactionRolesModel.create({
					channelID,
					messageID,
					reaction,
					roles,
				});

				message.delete();
				actualMessage.react(reaction);
				answerEmbed.setDescription(
					`Вы привязали реакцию ${reaction} к [сообщению](${
						actualMessage.url
					}), и назначили роль ${roles.map(r => `**<@&${r}>**`).join(", ")}`
				);
				message.channel.send({ content: message.author.toString(), embeds: [answerEmbed] });
				break;
			case "remove":
				await reactionRolesModel.deleteOne({
					channelID,
					messageID,
					reaction,
				});

				message.delete();
				actualMessage.reactions.cache
					.find(r => (emoji?.id ? r.emoji.id === emoji.id : r.emoji.name === reaction))
					?.remove();
				answerEmbed.setDescription(
					`Вы успешно убрали реакцию ${reaction} с [сообщения](${
						actualMessage.url
					}) в канале ${channel.toString()}`
				);
				message.channel.send({ content: message.author.toString(), embeds: [answerEmbed] });
				break;
			case "addrole":
				roles = message.mentions.roles.size
					? message.mentions.roles.map(r => r.id)
					: args.length > 4
					? args.slice(4, args.length)
					: [args[4]];

				for (const role of roles) {
					if (!message.guild.roles.cache.has(role as Snowflake)) {
						util.errorMessage(message, {
							text: `Роль с **ID** \`${role}\` не найдена на сервере. Запустите команду еще раз, указав правильную роль/роли`,
							reply: true,
						});
						break;
					}
				}

				const updatedRoles = roles.concat(alreadyExist!.roles);

				await reactionRolesModel.updateOne(
					{
						channelID,
						messageID,
						reaction,
					},
					{
						roles: updatedRoles as Snowflake[],
					}
				);

				answerEmbed.setDescription(
					`Роли ${roles
						.map(r => `**<@&${r}>**`)
						.join(", ")} были добавлены к реакции ${reaction} у [сообщения](${
						actualMessage.url
					})`
				);

				message.delete();
				message.channel.send({ content: message.author.toString(), embeds: [answerEmbed] });
				break;
			case "removerole":
				let filteredRoles = alreadyExist!.roles;

				roles = message.mentions.roles.size
					? message.mentions.roles.map(r => r.id)
					: args.length > 4
					? args.slice(4, args.length)
					: [args[4]];

				for (const role of roles) {
					if (!message.guild.roles.cache.has(role as Snowflake)) {
						util.errorMessage(message, {
							text: `Роль с **ID** \`${role}\` не найдена на сервере. Запустите команду еще раз, указав правильную роль/роли`,
							reply: true,
						});
						break;
					} else {
						filteredRoles = filteredRoles.filter(k => k != role);
					}
				}

				await reactionRolesModel.updateOne(
					{
						channelID,
						messageID,
						reaction,
					},
					{
						roles: filteredRoles,
					}
				);

				answerEmbed.setDescription(
					`Вы успешно убрали роли ${roles
						.map(r => `**<@&${r}>**`)
						.join(", ")} у реакции ${reaction} у [сообщения](${actualMessage.url})`
				);
				message.delete();
				message.channel.send({ content: message.author.toString(), embeds: [answerEmbed] });
				break;
			case "info":
				const embed = new MessageEmbed()
					.setColor(config.colors.embedBlankColor as ColorResolvable)
					.setDescription(
						`Информация к автоматической выдачи ролей по реакции ${reaction}` +
							`\nСообщение к которому прикреплена эта реакция: [тык](${actualMessage.url})` +
							`\nКанал в котором находится эта реакция с сообщение: ${channel.toString()}` +
							`\nРоли которые участник получает за нажатие:\n${alreadyExist!.roles
								.map(r => `<@&${r}>`)
								.join("\n")}`
					);

				message.delete();
				message.channel.send({ content: message.author.toString(), embeds: [embed] });
				break;
		}
	},
};

export default cmd;
