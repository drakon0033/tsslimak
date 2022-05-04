import { MessageEmbed, Snowflake } from "discord.js";
import moment from "moment";
import { activatedRoles } from "../../db/models/activatedRoles";
import { UnixesTimes } from "../../db/models/unixesTimes";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "roles",
	cooldown: 2,
	aliases: ["роли"],
	example: ["roles", "roles @mention", "roles id"],
	helpInfo: "Команда для просмотра временных ролей",
	category: "Shop",
	permission: "User",
	run: async (Client, message, args) => {
		const member = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		const colorRoles = await activatedRoles.find({
			uid: member!.id,
		});

		const unixesRole = await UnixesTimes.find({
			uid: member!.id,
		});

		const embed = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setAuthor(
				`Временные роли пользователя ${member!.user.tag}`,
				member!.user.displayAvatarURL({ size: 2048, dynamic: true })
			);

		if (!colorRoles.length && !unixesRole.length) {
			return util.errorMessage(message, {
				text: "У вас или упомянутого пользователя нет временных/бесконечных ролей",
				reply: true,
			});
		}

		const currentTime = new Date().getTime();
		const text = colorRoles.length
			? colorRoles
					.map(
						role =>
							`\\⌚ \`${
								role.removeTime
									? timeFormat(role.removeTime - currentTime)
									: "Навсегда"
							}\` - **<@&${role.roleID}>**`
					)
					.join("\n")
			: "";
		const secondText = unixesRole.length
			? unixesRole
					.map(
						role =>
							`\\⌚ \`${
								role.removeTime
									? timeFormat(role.removeTime - currentTime)
									: "Навсегда"
							}\` - **<@&${role.roleID}>**`
					)
					.join("\n")
			: "";

		message.channel.send({
			content: message.author.toString(),
			embeds: [embed.setDescription(`${text}\n${secondText}`)],
		});
	},
};

function timeFormat(time: number) {
	const duration = moment.duration(time);

	const hours = duration.hours();
	const days = duration.days();
	const minutes = duration.minutes();
	const sHours = hours < 10 ? `0${hours}` : `${hours}`;
	const sMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
	const sDays = days < 10 ? `0${days}` : `${days}`;

	return sDays + "д " + sHours + "ч " + sMinutes + "м";
}

export default cmd;
