import { MessageEmbed, Snowflake } from "discord.js";
import { birthdayModel } from "../../db/models/birthday";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "bday",
	cooldown: 2,
	aliases: ["др"],
	example: ["bday [@member, userID]", "bday set 03-31"],
	helpInfo: "Команда для установки или просмотра даты день рождения",
	category: "General",
	permission: "User",
	run: async (Client, message, args) => {
		const possibleId = args[0];

		if (possibleId && possibleId === "set") {
			let bday = args[1];

			if (!bday) {
				return util.errorMessage(message, {
					text: "Вы не указали дату день рождения",
					reply: true,
				});
			}

			const matched = bday.match(/^(\d{1,2})\-(\d{1,2})$/);

			if (!matched) {
				return util.errorMessage(message, {
					text: "Укажите дату в формате месяц-число",
					reply: true,
				});
			}

			const day = Number(matched[2]);
			const month = Number(matched[1]);

			const sendErr = () => {
				util.errorMessage(message, {
					text: "Введите дату в формате месяц-число, пример 03-10",
					reply: true,
				});
			};

			if (month < 1 || month > 12) {
				return sendErr();
			}
			if (day > 31) {
				return sendErr();
			}
			if (month === 2 && day > 29) {
				return sendErr();
			}
			if ([4, 6, 9, 11].includes(month) && day > 30) {
				return sendErr();
			}

			bday = `${`0${month}`.substr(-2)}-${`0${day}`.substr(-2)}`;
			const grantedPermission = config.ids.roleIds.AdminRoles.concat(
				config.ids.roleIds.ModeratorRoles
			);

			const alreadyIn = await birthdayModel.findOne({
				uid: message.author.id,
			});

			if (
				alreadyIn &&
				!message.member?.roles.cache.some(role => grantedPermission.includes(role.id))
			) {
				return util.errorMessage(message, {
					text: `Вы уже установили себе ДР. Дата \`${alreadyIn.bdayDate}\`. Если хотите поменять - обратитесь к администрации`,
					reply: true,
				});
			} else if (!alreadyIn) {
				await birthdayModel.create({
					uid: message.author.id,
					bdayDate: bday,
				});

				return message.channel.send(
					`${message.author.toString()}, вы установили себе день рождение датой \`${bday}\``
				);
			} else if (
				message.member?.roles.cache.some(role => grantedPermission.includes(role.id))
			) {
				const mention = await util.getDiscordMember(message, {
					uid: args[2] as Snowflake,
					returnNothing: true,
				});

				if (!mention) {
					return util.errorMessage(message, {
						text: "Вам нужно упомянуть пользователя, или указать его ID в самом конце команды",
						reply: true,
					});
				}

				await birthdayModel.updateOne(
					{ uid: mention.id },
					{
						bdayDate: bday,
					}
				);

				const answerEmbed = new MessageEmbed()
					.setDescription(
						`Дата \`${bday}\` была установлена как день рождение пользователю ${mention.toString()}`
					)
					.setColor(message.member?.displayColor!);

				return message.channel.send({
					content: message.author.toString(),
					embeds: [answerEmbed],
				});
			}
		} else {
			const member = await util.getDiscordMember(message, {
				uid: possibleId as Snowflake,
			});

			if (!member) {
				return util.errorMessage(message, {
					text: "Вы забыли упомянуть или указать ID участника",
					reply: true,
				});
			}

			const birthdayEntry = await birthdayModel.findOne({
				uid: member.id,
			});

			if (!birthdayEntry) {
				return util.errorMessage(message, {
					text: `${
						member.id === message.author.id ? "У вас" : "У этого пользователя"
					} не установлен ДР`,
					reply: true,
				});
			}

			return message.channel.send(
				`${
					member.id === message.author.id
						? `Ваше день рождение \`${birthdayEntry.bdayDate}\``
						: `День рождение у пользователя \`${member.user.tag}\` установлено на \`${birthdayEntry.bdayDate}\``
				}`
			);
		}
	},
};

export default cmd;
