import { MessageEmbed } from "discord.js";
import moment from "moment";
import { colorShop } from "../../db/models/colorShop";
import { COMMAND, config } from "../../struct";

const cmd: COMMAND = {
	name: "colorshop",
	cooldown: 2,
	example: ["colorshop"],
	helpInfo: "Команда для просмотра доступных ролей для покупки",
	category: "Shop",
	permission: "User",
	run: async (Client, message, args) => {
		const rolesList = await colorShop.find();
		rolesList.sort((a, b) => a.rolePrice! - b.rolePrice!);
		const embed = new MessageEmbed()
			.setAuthor(
				`Магазин цветных ролей.`,
				message.guild?.iconURL({ size: 2048, dynamic: true })!
			)
			.setColor(message.member?.displayColor!)
			.setThumbnail(`https://image.flaticon.com/icons/png/512/1069/1069102.png`)
			.setFooter(`${config.guildSettings.PREFIX}colorbuy номер - для покупки роли.`)
			.addFields(
				{ name: "‎", value: "**Номер:⠀⠀⠀‎‎‎‎‎‎Роль:**", inline: true },
				{ name: "‎", value: "⠀⠀**Цена:**", inline: true },
				{ name: "‎", value: "⠀⠀**Время:**", inline: true }
			);
		for (let i = 0; i < rolesList.length; i++) {
			const roleData = rolesList[i];
			const time = roleData.roleTime ? timeFormat(roleData.roleTime) : "Навсегда";
			embed.addFields(
				{
					name: "‎",
					value: `⠀⠀**${roleData.rolePosition}**⠀⠀⠀⠀**<@&${roleData.roleID}>**`,
					inline: true,
				},
				{
					name: "‎",
					value: `⠀⠀\`${roleData.rolePrice}\` ${config.emojis.SHARDS}`,
					inline: true,
				},
				{ name: "‎", value: `⠀⠀\`${time}\` ⌚`, inline: true }
			);
		}
		message.channel.send({ content: message.author.toString(), embeds: [embed] });
	},
};

function timeFormat(time: number) {
	const duration = moment.duration(time);

	const hours = duration.hours();
	const days = Math.floor(duration.asDays());
	const sHours = hours < 10 ? `0${hours}` : `${hours}`;
	const sDays = days < 10 ? `0${days}` : `${days}`;

	return sDays + "д " + sHours + "ч";
}

export default cmd;
