import { guildSettings } from "../../db/models/guildSettings";
import { COMMAND, errorCodes, util } from "../../struct";

const cmd: COMMAND = {
	name: "rename",
	cooldown: 2,
	aliases: ["переименовать"],
	example: ["rename asdasdasd"],
	helpInfo: "Команда для переименовывания войс-канала",
	category: "Voice",
	permission: "User",
	run: async (Client, message, args) => {
		const guildData = await guildSettings.findOne({
			gid: message.guild?.id,
		});

		let voiceChannel = message.member?.voice.channel;
		if (!voiceChannel) {
			return util.errorMessage(message, {
				text: "Вы должны находиться в войсе",
				reply: true,
			});
		}

		if (
			voiceChannel.parentId === guildData?.vLuvCat ||
			voiceChannel.parentId != guildData?.vCat
		) {
			return util.errorMessage(message, {
				text: "Вы не можете поменять название для лаврумы, или этого канала",
				reply: true,
			});
		}
		if (voiceChannel.id === guildData?.vChannelCreate) {
			return util.errorMessage(message, {
				text: "Вы не можете переименовать этот войс",
				reply: true,
			});
		}

		const memberPermissions = voiceChannel.permissionsFor(message.member!);

		if (!memberPermissions?.has("CREATE_INSTANT_INVITE")) {
			return util.errorMessage(message, {
				text: "Вы должны быть создателем комнаты, что бы сменить название",
				reply: true,
			});
		}

		const name = args.join(" ");
		const privName = voiceChannel.name;

		try {
			await voiceChannel.setName(name);
			return message.channel.send(
				`${message.author.toString()}, канал \`${privName}\` был переименован в \`${name}\``
			);
		} catch (err) {
			util.DiscordErrorHandler(err, {
				cmd,
				message,
			});
			util.errorMessage(message, {
				text: "Произошла следующая ошибка:\n" + errorCodes[err.code],
				reply: true,
			});
		}
	},
};

export default cmd;
