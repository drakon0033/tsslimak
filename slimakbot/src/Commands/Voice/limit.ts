import { guildSettings } from "../../db/models/guildSettings";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "limit",
	cooldown: 2,
	aliases: ["лимит"],
	example: ["limit 55"],
	helpInfo: "Команда для изменения лимита в канале",
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

		if (voiceChannel.type === "GUILD_STAGE_VOICE") return;

		if (
			voiceChannel.parentId === guildData?.vLuvCat ||
			voiceChannel.parentId != guildData?.vCat
		) {
			return util.errorMessage(message, {
				text: "Вы не можете поменять лимит для лаврумы, или этого канала",
				reply: true,
			});
		}
		if (voiceChannel.id === guildData?.vChannelCreate) {
			return util.errorMessage(message, {
				text: "Вы не можете изменить лимит для этого войса",
				reply: true,
			});
		}

		const memberPermissions = voiceChannel.permissionsFor(message.member!);

		if (!memberPermissions?.has("CREATE_INSTANT_INVITE")) {
			return util.errorMessage(message, {
				text: "Вы должны быть создателем комнаты, что бы сменить лимит",
				reply: true,
			});
		}

		if (!args[0]) {
			return util.errorMessage(message, {
				text: "Вы не указали новый лимит",
				reply: true,
			});
		}

		const newLim =
			Number(args[0]) && Number(args[0]) >= 100
				? 99
				: Number(args[0]) < 0
				? 0
				: Number(args[0]);

		const prevLim = voiceChannel.userLimit;

		voiceChannel = await voiceChannel.setUserLimit(newLim);

		message.channel.send(
			`${message.author.toString()}, лимит для канала \`${
				voiceChannel.name
			}\` изменился с \`${prevLim === 0 ? "♾" : prevLim}\` на \`${
				newLim === 0 ? "♾" : newLim
			}\``
		);
	},
};

export default cmd;
