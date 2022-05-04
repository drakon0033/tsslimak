import { Snowflake } from "discord.js";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "kick",
	cooldown: 2,
	aliases: ["кик"],
	example: ["kick @mention reason", "kick userID reason"],
	helpInfo: "Команда для изгнания пользователя с сервера",
	category: "Mod 1",
	permission: "Moderator",
	run: async (Client, message, args) => {
		const target = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
			returnNothing: true,
		});
		const reason = args.slice(1, args.length).join(" ");

		const rolesIDs = config.ids.roleIds;
		const whitelistRoles = rolesIDs.AdminRoles.concat(rolesIDs.ModeratorRoles);

		if (message.author.id != config.ids.userIds.OWNER_ID) {
			if (
				!target ||
				target!.id === message.author.id ||
				target!.roles.cache.some(r => whitelistRoles.includes(r.id))
			) {
				return util.errorMessage(message, {
					text: "Вы не указали участника, либо не можете кикнуть упомянутого пользователя",
					reply: true,
				});
			}
		}

		try {
			await target!.kick(reason);

			message.channel.send(
				`Участник ${target!.toString()}(${target!.user.tag}) | ${
					target!.id
				}\nБыл успешно кикнут.`
			);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
			return util.errorMessage(message, {
				text: "Во время выполнения команды произошла ошибка",
				reply: true,
			});
		}
	},
};

export default cmd;
