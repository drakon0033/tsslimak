import { MessageEmbed, Snowflake } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "give",
	category: "Economy",
	permission: "User",
	cooldown: 2,
	helpInfo: "Команда для передачи осколков другому юзеру",
	example: ["give @mention amount", "give userID amount"],
	aliases: ["передать"],
	run: async (Client, message, args) => {
		const target = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
		});

		if (target?.user.id === message.author.id) {
			return util.errorMessage(message, {
				text: "Вы должны упомянуть участника",
				reply: true,
				example: true,
				cmd,
			});
		}

		const amount = Number(args[1]);

		if (Number.isNaN(amount) || amount < 0) {
			return util.errorMessage(message, {
				text: "Вы должны указать правильное число, которое должно быть больше 0",
				reply: true,
			});
		}

		await userModel.updateOne(
			{
				uid: message.author.id,
			},
			{
				$inc: {
					shards: -amount,
				},
			}
		);
		await userModel.updateOne(
			{
				uid: target?.id,
			},
			{
				$inc: {
					shards: amount,
				},
			}
		);

		const embed = new MessageEmbed()
			.setAuthor(
				`Перевод осколков`,
				message.guild?.iconURL({
					size: 2048,
					dynamic: true,
				})!
			)
			.setDescription(
				`Вам было переведено \`${amount}\` ${
					config.emojis.SHARDS
				} от ${message.author.toString()}`
			)
			.setColor(message.member?.displayColor!);

		message.channel.send({ content: target?.toString(), embeds: [embed] });
	},
};

export default cmd;
