import { Util } from "discord.js";
import { COMMAND, errorCodes, util } from "../../struct";

const cmd: COMMAND = {
	name: "steal",
	cooldown: 2,
	aliases: ["украсть"],
	example: ["steal emoji hehehe", "steal emojiURL heheha"],
	helpInfo: 'Команда для "кражи" смайликов',
	category: "Mod 1",
	permission: "Moderator",
	run: async (Client, message, args) => {
		const emoji = args[0];
		const emojiName = args[1];

		if (!emoji || !emojiName) {
			return util.errorMessage(message, {
				text: "Вы забыли указать эмодзи, или ссылку на него, а так же его название",
				reply: true,
			});
		}

		if (emoji?.startsWith("https://")) {
			try {
				const createdEmoji = await message.guild?.emojis.create(emoji, emojiName);
				message.channel.send(
					`Смайл ${createdEmoji} с названием \`${emojiName}\` был успешно создан.`
				);
			} catch (error) {
				util.DiscordErrorHandler(error, {
					cmd,
					message,
				});
				message.channel.send(
					`При выполнении команды произошла ошибка:\n\`${errorCodes[error.code]}\``
				);
			}
		} else {
			const parsedEmoji = Util.parseEmoji(emoji);
			let link: string;

			switch (true) {
				case parsedEmoji?.animated:
					link = `https://cdn.discordapp.com/emojis/${parsedEmoji?.id}.gif`;
					break;
				default:
					link = `https://cdn.discordapp.com/emojis/${parsedEmoji?.id}.png`;
					break;
			}

			try {
				const createdEmoji = await message.guild?.emojis.create(link, emojiName);
				message.channel.send(
					`Смайл ${createdEmoji} с названием \`${emojiName}\` был успешно создан.`
				);
			} catch (error) {
				util.DiscordErrorHandler(error, {
					cmd,
					message,
				});
				message.channel.send(
					`При выполнении команды произошла ошибка:\n\`${errorCodes[error.code]}\``
				);
			}
		}
	},
};

export default cmd;
