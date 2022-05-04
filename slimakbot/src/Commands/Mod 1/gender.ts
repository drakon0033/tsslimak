import { GuildMember, Message, MessageEmbed, Snowflake } from "discord.js";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "gender",
	cooldown: 2,
	aliases: ["гендер"],
	example: ["gender @mention female", "gender userID male"],
	helpInfo: "Команда для выдачи гендерной роли на сервере",
	category: "Mod 1",
	permission: "Moderator",
	run: async (Client, message, args) => {
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

		const gender = ["female", "male"].includes(args[1]) ? args[1] : undefined;

		if (!gender) {
			return util.errorMessage(message, {
				text: "Вы указали неверный гендер",
				reply: true,
			});
		}

		const ok = {
			female: addFemale,
			male: addMale,
		};

		ok[gender](message, member);

		message.delete();
	},
};

function addMale(message: Message, mention: GuildMember) {
	const maleRole = message.guild?.roles.cache.get(config.ids.roleIds.maleRole);
	const femaleRole = mention.roles.cache.get(config.ids.roleIds.femaleRole);

	if (femaleRole) {
		mention.roles.remove(femaleRole);
	}

	mention.roles.add(maleRole!);

	const embed = new MessageEmbed()
		.setColor(message.member?.displayColor!)
		.setDescription(`Вам была выдана роль **${maleRole?.toString()}**`);
	message.channel.send({ content: mention.toString(), embeds: [embed] });
}

function addFemale(message: Message, mention: GuildMember) {
	const femaleRole = message.guild?.roles.cache.get(config.ids.roleIds.femaleRole);
	const maleRole = mention.roles.cache.get(config.ids.roleIds.maleRole);

	if (maleRole) {
		mention.roles.remove(maleRole);
	}

	mention.roles.add(femaleRole!);

	const embed = new MessageEmbed()
		.setColor(message.member?.displayColor!)
		.setDescription(`Вам была выдана роль **${femaleRole?.toString()}**`);
	message.channel.send({ content: mention.toString(), embeds: [embed] });
}

export default cmd;
