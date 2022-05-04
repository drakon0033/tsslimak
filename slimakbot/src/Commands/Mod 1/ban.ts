import { COMMAND, config, util } from "../../struct";
import { MessageEmbed, Snowflake } from "discord.js";

const cmd: COMMAND = {
	name: "ban",
	cooldown: 2,
	aliases: ["бан"],
	example: ["ban @mention", "ban userID"],
	helpInfo: "Команда для бана участника",
	category: "Mod 1",
	permission: "Admin",
	run: async (Client, message, args) => {
		const target = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
			returnNothing: true,
		});
		const rolesIDs = config.ids.roleIds;
		const whitelistRoles = rolesIDs.AdminRoles.concat(rolesIDs.ModeratorRoles);

		if (!target) {
			return util.errorMessage(message, {
				text: "Вам нужно упомянуть участника или указать его ID",
				reply: true,
			});
		}

		if (
			target!.id === message.author.id ||
			target!.roles.cache.some(r => whitelistRoles.includes(r.id))
		) {
			return util.errorMessage(message, {
				text: "Вы не можете забанить этого участника",
				reply: true,
			});
		}

		const reason = args.slice(1, args.length).join(" ");

		target!.ban({
			reason: `Бан от ${message.author.toString()}, причина ${reason}`,
		});

		const mainChat = util.getTextChannel(config.ids.channelIds.GeneralChat, message.guild!);
		const embedText =
			`Забанен ${target!.toString()}(${target!.user.tag})` +
			`\nДата захода на сервер <t:${Math.floor(target.joinedTimestamp! / 1000)}>` +
			`\nЗабанил ${message.member?.toString()}` +
			`\nID \`${target!.id}\``;

		const embed = new MessageEmbed()
			.setTitle(`Ой-ой, новый бан <:OzonF:697113617266507906>`)
			.setDescription(embedText)
			.setColor(message.member?.displayColor!);

		mainChat.send({ embeds: [embed] }).then(m => util.deleteMessage(m, 30000));
	},
};

export default cmd;
