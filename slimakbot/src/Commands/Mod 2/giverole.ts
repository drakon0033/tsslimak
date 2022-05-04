import { MessageEmbed, Snowflake } from "discord.js";
import { UnixesTimes } from "../../db/models/unixesTimes";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "giverole",
	cooldown: 2,
	aliases: ["выдатьроль"],
	example: ["giverole @mention roleID/roleMention time"],
	helpInfo: "Команда для выдачи ролей пользователю",
	category: "Mod 2",
	permission: "Admin",
	run: async (Client, message, args) => {
		const result = util.getTime(args.slice(2));

		const role = message.mentions.roles.first()
			? message.mentions.roles.first()
			: message.guild?.roles.cache.get(args[1] as Snowflake);
		const member = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
			returnNothing: true,
		});

		if (!member) {
			return util.errorMessage(message, {
				text: "Вам нужно упомянуть участника или указать его ID",
				reply: true,
			});
		}

		if (!role) {
			return util.errorMessage(message, {
				text: "Роль с таким **ID** не существует",
				reply: true,
			});
		}

		if (member.user.bot) {
			return util.errorMessage(message, {
				text: "Вы не можете выдать роль боту",
				reply: true,
			});
		}

		member.roles.add(role, `giverole executed by ${message.author.tag}`);

		const existing = await UnixesTimes.findOne({
			uid: member.id,
			roleID: role.id,
		});

		const answerEmbed = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setAuthor(
				message.author.tag,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			);

		if (existing) {
			await UnixesTimes.updateOne(
				{
					uid: member.id,
					roleID: role.id,
				},
				{
					removeTime: existing!.removeTime! + result!.difference!,
				}
			);

			const newDate = new Date(existing.removeTime! + result!.difference!);

			answerEmbed.setDescription(
				`Роль **${role!.toString()}** которую вам выдавали, была продлена до <t:${Math.floor(
					newDate.getTime() / 1000
				)}>`
			);
		} else {
			await UnixesTimes.create({
				uid: member.id,
				roleID: role.id,
				removeTime: result?.milliseconds,
			});

			answerEmbed.setDescription(
				`Вам была выдана роль **${role!.toString()}** до <t:${Math.floor(
					result!.milliseconds! / 1000
				)}>`
			);
		}

		message.delete();
		message.channel.send({ content: member.toString(), embeds: [answerEmbed] });
	},
};

export default cmd;
