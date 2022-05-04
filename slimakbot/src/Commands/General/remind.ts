import { MessageEmbed, Snowflake } from "discord.js";
import { Reminders } from "../../db/models/reminders";
import { COMMAND, config, util } from "../../struct";
import moment from "moment";
import uniqid from "uniqid";

const cmd: COMMAND = {
	name: "remind",
	cooldown: 2,
	aliases: ["напомни", "напоминание"],
	example: ["remind after 1h wash hair", "напомни в 2021-12-31 23:55:00 с НОВЫМ ГОДОМ!"],
	helpInfo: "Команда для создания напоминаний",
	category: "General",
	permission: "User",
	advancedInfo: `remind action date/time text\n\n\`action\`: через, в, список, удалить
    \`time/date\`: 1d 1h 1m 1s всё опционально, year-month-day hours:minutes:seconds\n\nПример:\n\`!remind через 3h проверить бота\`
    \`!remind в 2020-12-31 23:55:00 с новым годом!\`
    \`!remind список\`
    \`!remind удалить remindID\``,
	run: async (Client, message, args) => {
		const action = args[0];
		const answerEmbed = new MessageEmbed()
			.setAuthor(
				message.author.tag,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setColor(message.member?.displayColor!);

		const totalReminders = (await Reminders.find({ uid: message.author.id })).length;
		const fiveYears = 3.154e10 * 5;
		const currentTime = new Date().getTime();

		switch (true) {
			case ["список", "list"].includes(action):
				const target = await util.getDiscordMember(message, {
					returnNothing: false,
					uid: args[1] as Snowflake,
				});
				const userReminders = await Reminders.find({
					uid: target!.id,
				});
				const desc =
					target!.id === message.author.id
						? "У вас нет активных напоминаний"
						: "У упомянутого участника нет активных напоминаний";
				if (!userReminders.length) {
					return util.errorMessage(message, {
						text: desc,
						reply: true,
					});
				}
				userReminders.sort((a, b) => a.remindTime! - b.remindTime!);

				target!.id === message.author.id
					? answerEmbed.setAuthor(
							`Ваши напоминания`,
							message.author.displayAvatarURL({
								size: 2048,
								dynamic: true,
							})
					  )
					: answerEmbed.setAuthor(
							`Напоминание пользователя ${target!.user.tag}`,
							target!.user.displayAvatarURL({
								size: 2048,
								dynamic: true,
							})
					  );

				const answer = userReminders
					.map(
						(value, index) =>
							`**ID**: \`${value.counter}\` ` +
							`**Сработает**: **<t:${Math.floor(
								value.remindTime! / 1000
							)}>**\n**Текст**: ${value.text}`
					)
					.join("\n\n");
				message.channel.send({
					content: message.author.toString(),
					embeds: [answerEmbed.setDescription(answer)],
				});
				break;
			case ["через", "after"].includes(action):
				const time = util.getTime(args, {
					shift: true,
				})!;
				if (
					!time.milliseconds ||
					time?.milliseconds! <= currentTime ||
					time?.milliseconds! > currentTime + fiveYears
				) {
					return util.errorMessage(message, {
						text: "Вы указали неверное время. Напоминание не может быть на больше чем **5** лет",
						reply: true,
						example: true,
						cmd,
					});
				}
				if (!time.reason) {
					return util.errorMessage(message, {
						text: "Вы не указали текст напоминания",
						reply: true,
					});
				}
				await Reminders.create({
					counter: uniqid.time(),
					uid: message.author.id,
					remindTime: time.milliseconds,
					text: time.reason,
				});
				message.channel.send(
					`${message.author.toString()}, Напоминание успешно установлено на <t:${Math.floor(
						time.milliseconds / 1000
					)}>`
				);
				break;
			case ["в", "in"].includes(action):
				const validateDate = util.getTime(args, {
					shift: true,
					validateDate: true,
				});
				if (
					!validateDate ||
					validateDate.milliseconds! <= currentTime ||
					validateDate.milliseconds! > currentTime + fiveYears
				) {
					return util.errorMessage(message, {
						text: "Вы указали неверное время. Напоминание не может быть на больше чем **5** лет",
						reply: true,
						example: true,
						cmd,
					});
				}
				await Reminders.create({
					counter: uniqid.time(),
					uid: message.author.id,
					remindTime: validateDate.milliseconds,
					text: validateDate.reason,
				});
				message.channel.send(
					`${message.author.toString()}, Напоминание успешно установлено на <t:${Math.floor(
						validateDate.milliseconds! / 1000
					)}>`
				);
				break;
			case ["удалить", "remove"].includes(action):
				if (!totalReminders) {
					return util.errorMessage(message, {
						text: "Что бы удалить напоминание, его нужно сначала создать",
						reply: true,
					});
				}
				const entry = await Reminders.findOneAndDelete({
					counter: args[1],
					uid: message.author.id,
				});

				if (!entry) {
					return util.errorMessage(message, {
						text: "Вы указали неверное **ID** своего напоминания",
						reply: true,
					});
				}

				message.channel.send(
					`${message.author.toString()}, Вы успешно удалили напоминание \`${args[1]}\``
				);
				break;
			default:
				util.errorMessage(message, {
					text: `Вы указали неверное действие. Больше узнать о команде \`${config.guildSettings.PREFIX}help ${cmd.name}\``,
					reply: true,
				});
				break;
		}
	},
};

export default cmd;
