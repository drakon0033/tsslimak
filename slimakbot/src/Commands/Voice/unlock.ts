import { Snowflake } from "discord.js";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "unlock",
	cooldown: 2,
	example: ["unlock @mention", "unlock userID"],
	helpInfo: "Команда для открытия доступа кикнутому пользователю",
	category: "Voice",
	permission: "User",
	run: async (Client, message, args) => {
		const target = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
			returnNothing: true,
		});

		if (!target) {
			return util.errorMessage(message, {
				text: "Вам нужно упомянуть участника или указать его ID",
				reply: true,
			});
		}

		if (target!.id === message.author.id || target!.user.bot) {
			return util.errorMessage(message, {
				text: "Вы указали неверного пользователя",
				reply: true,
			});
		}

		const voiceChannel = message.member?.voice.channel;

		if (!voiceChannel) {
			return util.errorMessage(message, {
				text: "Вы должны находиться в войсе, к которому хотите вернуть доступ участнику",
				reply: true,
			});
		}

		const memberPermissions = voiceChannel.permissionsFor(message.member!);

		if (!memberPermissions?.has("CREATE_INSTANT_INVITE")) {
			return util.errorMessage(message, {
				text: "Вы должны быть создателем комнаты, что бы открыть доступ участнику",
				reply: true,
			});
		}

		const targetPerms = voiceChannel.permissionOverwrites.cache.find(
			perm => perm.id === target.id
		);
		targetPerms?.delete();

		message.channel.send(
			`${target!.toString()} вам был открыт доступ к каналу \`${voiceChannel.name}\``
		);
	},
};

export default cmd;
