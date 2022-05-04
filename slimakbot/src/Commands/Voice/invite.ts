import { Invite } from "discord.js";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "invite",
	cooldown: 2,
	aliases: ["инвайт"],
	example: ["invite"],
	helpInfo: "Команда для получения ссылки-инвайта для голосового канала",
	category: "Voice",
	permission: "User",
	run: async (Client, message, args) => {
		const voiceChannel = message.member?.voice.channel;
		if (!voiceChannel) {
			return util.errorMessage(message, {
				text: "Вы должны находиться в войсе",
				reply: true,
			});
		}
		const invite = await voiceChannel.createInvite({
			reason: "invite command execute",
		});
		message.channel.send(
			`${message.author.toString()}, инвайт для канала: \`${voiceChannel.name}\`\n<${invite}>`
		);
	},
};

export default cmd;
