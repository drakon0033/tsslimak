import { MessageEmbed, Snowflake } from "discord.js";
import { guildSettings } from "../../db/models/guildSettings";
import { UnixesTimes } from "../../db/models/unixesTimes";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "unmute",
	cooldown: 2,
	aliases: ["размьют", "размут", "анмут", "снятьмут"],
	example: ["unmute userID", "unmute @mention"],
	helpInfo: "Команда для снятия мута с участника",
	category: "Mod 1",
	permission: "Moderator",
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

		const gSettings = await util.findOneOrCreate(
			guildSettings,
			{ gid: message.guild?.id },
			{ gid: message.guild?.id }
		);

		if (!gSettings?.muteRole) {
			return util.errorMessage(message, {
				text: "Мною на этом сервере еще не выдавались муты",
				reply: true,
			});
		}

		const hasRole = target.roles.cache.has(gSettings.muteRole);
		switch (true) {
			case hasRole:
				target.roles.remove(gSettings.muteRole);
				await UnixesTimes.findOneAndDelete({
					uid: target.id,
					roleID: gSettings.muteRole,
				});

				const embed = new MessageEmbed()
					.setColor(message.member?.displayColor!)
					.setDescription(
						`Пользователь ${message.author.toString()} снял с вас **мут** 👏🏻`
					);

				message.channel.send({ content: target.toString(), embeds: [embed] });
				break;
			default:
				return util.errorMessage(message, {
					text: "У этого пользователя нет мута",
					reply: true,
				});
		}
	},
};

export default cmd;
