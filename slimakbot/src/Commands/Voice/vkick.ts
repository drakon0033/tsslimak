import { Snowflake } from "discord.js";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "vkick",
	cooldown: 2,
	aliases: ["войскик", "вкик"],
	example: ["vkick @mention", "vkick userID"],
	helpInfo: "Команда для кика пользователя из вашего войса",
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
				text: "Вы не находитесь в войсе",
				reply: true,
			});
		}

		const memberPermissions = voiceChannel.permissionsFor(message.member!);

		if (!memberPermissions?.has("CREATE_INSTANT_INVITE")) {
			return util.errorMessage(message, {
				text: "Вы не создатель этого войса",
				reply: true,
			});
		}

		if (!target!.voice || target!.voice.channel?.id != voiceChannel.id) {
			return util.errorMessage(message, {
				text: "Этот участник не находится в вашем голосовом канале",
				reply: true,
			});
		}

		voiceChannel.permissionOverwrites.edit(target!, {
			CONNECT: false,
		});

		target!.voice.setChannel(null);

		message.channel.send(`${target!.toString()} вы были кикнуты с \`${voiceChannel.name}\``);
	},
};

export default cmd;
