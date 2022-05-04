import { MessageEmbed, Snowflake } from "discord.js";
import { UnixesTimes } from "../../db/models/unixesTimes";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "removerole",
	cooldown: 2,
	aliases: ["забратьроль"],
	example: ["removerole @mention roleID/roleMention time"],
	helpInfo: "Команда для того что бы убрать временную роль пользователя",
	category: "Mod 2",
	permission: "Admin",
	run: async (Client, message, args) => {
		const member = await util.getDiscordMember(message, {
			returnNothing: true,
			uid: args[0] as Snowflake,
		});

		if (!member) {
			return util.errorMessage(message, {
				text: "Вам нужно указать пользователя",
				reply: true,
			});
		}

		const role = message.mentions.roles.first()
			? message.mentions.roles.first()
			: message.guild!.roles.cache.get(args[1] as Snowflake);

		if (!role) {
			return util.errorMessage(message, {
				text: 'Вам нужно указать роль, которую вы хотите убрать из списка "временных" у пользователя',
				reply: true,
			});
		}

		const entry = await UnixesTimes.findOne({
			roleID: role.id,
			uid: member.id,
		});

		if (!entry) {
			return util.errorMessage(message, {
				text: "Я не нашла запись в базе с данным пользователем и ролью, которую вы указали",
				reply: true,
			});
		}

		member.roles.remove(role);
		await entry.deleteOne();

		const succ = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setDescription(
				`${message.author.toString()} забрал у вас временную роль ${role.toString()}`
			)
			.setAuthor(
				message.author.username,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			);

		message.channel.send({ content: member.toString(), embeds: [succ] });
	},
};

export default cmd;
