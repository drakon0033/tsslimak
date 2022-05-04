import { Client, Message, MessageEmbed, Snowflake } from "discord.js";
import { guildSettings } from "../../db/models/guildSettings";
import { UnixesTimes } from "../../db/models/unixesTimes";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "mute",
	cooldown: 2,
	aliases: ["мут"],
	example: ["mute @mention 1d дурачек", "mute userID 999d toxic KID :)(:"],
	helpInfo: "Команда для мута участника",
	category: "Mod 1",
	permission: "Moderator",
	advancedInfo: "Время должно быть в формате: 10d/д, 10h/ч, 10m/м, 10s/с",
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

		const result = util.getTime(args, {
			shift: true,
		});

		let gSetts = await util.findOneOrCreate(
			guildSettings,
			{ gid: message.guild?.id },
			{ gid: message.guild?.id }
		);

		const muteRoleId = gSetts?.muteRole;
		const currentTime = new Date().getTime();
		if (muteRoleId) {
			if (target.roles.cache.has(muteRoleId!)) {
				return util.errorMessage(message, {
					text: "У этого участника уже есть мут",
					reply: true,
				});
			}
		} else {
			await createMuteRole(message, Client);
			gSetts = await guildSettings.findOne({
				gid: message.guild?.id,
			});
		}

		if (result?.milliseconds! < currentTime) {
			return util.errorMessage(message, {
				text: "Вы забыли указать время на которое хотите замутить пользователя",
				reply: true,
				example: true,
				cmd,
			});
		}

		if (!result?.reason) {
			return util.errorMessage(message, {
				text: "Вы забыли указать причину мута",
				reply: true,
				example: true,
				cmd,
			});
		}

		const muteEmbedText =
			`Пользователь ${message.member?.toString()} выдал вам **мут**` +
			`\n**Причина**: ${result.reason}` +
			`\n**Время снятия**: <t:${Math.floor(result.milliseconds! / 1000)}>`;
		const muteEmbed = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setDescription(muteEmbedText)
			.setTimestamp(result.dateObj);

		target.roles.add(gSetts?.muteRole!);

		await UnixesTimes.create({
			uid: target.id,
			roleID: gSetts?.muteRole,
			removeTime: result.milliseconds,
		});

		message.channel.send({ content: target.toString(), embeds: [muteEmbed] });
	},
};

async function createMuteRole(message: Message, client: Client) {
	const gSettings = await guildSettings.findOne({
		gid: message.id,
	});
	const role = await message.guild?.roles.create({
		name: "MUTED 🤐",
		color: "#030303",
		reason: `Mute role for ${client.user?.tag}`,
	});

	message.guild?.channels.cache.forEach(channel => {
		switch (channel.type) {
			case "GUILD_TEXT":
				channel.permissionOverwrites.edit(role!, {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false,
				});
				break;
			case "GUILD_VOICE":
				if (![gSettings?.vLuvCat, gSettings?.vCat].includes(channel.parentId!)) {
					channel.permissionOverwrites.edit(role!, {
						SPEAK: false,
						STREAM: false,
					});
				}
				break;
		}
	});

	await guildSettings.updateOne(
		{ gid: message.guild?.id },
		{
			muteRole: role?.id,
		}
	);

	return;
}

export default cmd;
