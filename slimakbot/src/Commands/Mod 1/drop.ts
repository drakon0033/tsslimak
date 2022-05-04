import { Message, MessageEmbed } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "drop",
	cooldown: 2,
	aliases: ["дроп"],
	example: ["drop 250"],
	helpInfo: "Команда для дропа в чат осколков",
	category: "Mod 1",
	permission: "Admin",
	run: async (Client, message, args) => {
		const amount = Number(args[0]);

		if (isNaN(amount)) {
			return util.errorMessage(message, {
				text: "Вы указали неверное кол-во осколков",
				reply: true,
			});
		}

		const shardsEmoji = config.emojis.SHARDS;
		const notityDesc =
			`Кто-то только что выбросил в чат \`${amount}\` ${shardsEmoji}` +
			`\n\nИх можно подобрать командой \`!pick\` или \`!пик\``;

		const dropNotify = new MessageEmbed()
			.setAuthor(
				`Неизвестная личность`,
				message.guild?.iconURL({ size: 2048, dynamic: true })!
			)
			.setColor("RANDOM")
			.setThumbnail("https://cdn.discordapp.com/emojis/714694360331190312.png?v=1")
			.setDescription(notityDesc);

		const sendedMessage = await message.channel.send({ embeds: [dropNotify] });
		const prefix = config.guildSettings.PREFIX;

		const filter = (msg: Message) => {
			return !msg.author.bot && [`${prefix}pick`, `${prefix}пик`].includes(msg.content);
		};

		message.channel
			.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
			.then(async collected => {
				const member = collected.first()?.member;

				await userModel.updateOne(
					{ uid: member!.id },
					{
						$inc: {
							shards: amount,
						},
					}
				);

				const collectedEmbed = new MessageEmbed()
					.setDescription(
						`**${member?.user.tag} подбирает себе ${amount} ${shardsEmoji}**`
					)
					.setTitle(``)
					.setColor(member?.displayColor!);
				message.channel.send({ embeds: [collectedEmbed] });
				await sendedMessage.delete();
			})
			.catch(async error => {
				await sendedMessage.delete();
			});
	},
};

export default cmd;
