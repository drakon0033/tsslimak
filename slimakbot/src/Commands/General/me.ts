import { userModel } from "../../db/models/userModel";
import { COMMAND, util, config } from "../../struct";
import { MessageEmbed, Snowflake } from "discord.js";
import moment from "moment";
import { birthdayModel } from "../../db/models/birthday";

const cmd: COMMAND = {
	name: "me",
	category: "General",
	cooldown: 2,
	example: ["me", "me @target", "me userID"],
	helpInfo: "Покажет ваш профиль на сервере",
	permission: "User",
	aliases: ["я", "профиль"],
	run: async (Client, message, args) => {
		const member = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		if (member?.user.bot) {
			return message.delete();
		}

		let user = await userModel.findOne({
			uid: member?.id,
		});

		user = await util.lvlUp(
			member!,
			util.getTextChannel(config.ids.channelIds.SkyNet, member?.guild!)
		);
		user = (await util.updateVoiceTime(member!, { returnUser: true }))!;

		let userLuv;
		if (user.luv) {
			try {
				userLuv = (await message.guild?.members.fetch(user.luv))!.user.username;
			} catch (error) {
				userLuv = "Не найдена на сервере";
				util.DiscordErrorHandler(error, {
					cmd,
					message,
				});
			}
		} else {
			userLuv = "Отсутствует";
		}

		const bday = await birthdayModel.findOne({ uid: member!.id });
		const bdayText = bday ? ` | ДР ${bday.bdayDate}` : "";

		const infoEmbed = new MessageEmbed()
			.setAuthor(
				`Профиль ${member!.displayName}${bdayText}`,
				member?.user.displayAvatarURL({ size: 2048 })
			)
			.setColor(member!.displayColor)
			.setImage(user!.picture!)
			.setDescription(`\`\`\`ini\n[ ${user!.status} ]\`\`\``)
			.addFields(
				{
					name: `${config.emojis.MICRO} Войс-онлайн:`,
					value: `\`\`\`xl\n${timeFormat(user.voice?.allTime!)}\`\`\``,
					inline: true,
				},
				{
					name: `${config.emojis.LVL} Уровень`,
					value: `\`\`\`xl\n${user!.lvl}\`\`\``,
					inline: true,
				},
				{
					name: `${config.emojis.SHARDS} Осколков:`,
					value: `\`\`\`xl\n${user!.shards}\`\`\``,
					inline: true,
				},
				{
					name: `${config.emojis.CAPS} До капсулы:`,
					value: `\`\`\`xl\n${timeFormat(user.voice?.voiceBonus!)}\`\`\``,
					inline: true,
				},
				{
					name: `❤ Пара:`,
					value: `\`\`\`xl\n${userLuv}\`\`\``,
					inline: true,
				},
				{
					name: `${config.emojis.MESSAGES} Сообщений:`,
					value: `\`\`\`xl\n${user!.messages}\`\`\``,
					inline: true,
				},
				{
					name: `\\📦 Инвентарь:`,
					value: `${config.emojis.CAPS}: \`${user!.inventory!.capsuls}\`\n${
						config.emojis.PART
					}: \`${user!.inventory!.particles}\``,
					inline: true,
				}
			);
		message.channel.send({ content: message.author.toString(), embeds: [infoEmbed] });
	},
};

function timeFormat(time: number) {
	const duration = moment.duration(time);

	const minutes = duration.minutes();
	const hours = Math.floor(duration.asHours());

	const sHours = hours < 10 ? `0${hours}` : `${hours}`;
	const sMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

	return sHours + "ч:" + sMinutes + "м";
}

export default cmd;
