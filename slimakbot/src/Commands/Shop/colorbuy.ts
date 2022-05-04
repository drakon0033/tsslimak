import { colorShop } from "../../db/models/colorShop";
import { COMMAND, config, maps, util } from "../../struct";
import moment from "moment";
import { MessageEmbed, MessageReaction, User } from "discord.js";
import { userModel } from "../../db/models/userModel";

const checkRoles = [
	"719016288248135681",
	"719016291653910557",
	"719016294799900783",
	"719016296674623571",
	"719016298641883226",
];

const cmd: COMMAND = {
	name: "colorbuy",
	cooldown: 2,
	example: ["colorbuy position"],
	helpInfo: "Команда для покупки роли",
	category: "Shop",
	permission: "User",
	run: async (Client, message, args) => {
		if (maps.userInTask.has(message.author.id)) {
			return util.errorMessage(message, {
				text: "Завершите прошлое действие для использования этой команды",
				reply: true,
			});
		}

		const positions = ["1", "2", "3", "4", "5"];

		if (!args[0] || !positions.includes(args[0])) {
			return util.errorMessage(message, {
				text: "Вы указали неверную позицию роли в магазине",
				reply: true,
			});
		}

		const position = Number(args[0]);

		const roleData = await colorShop.findOne({
			rolePosition: position,
		});

		const time = roleData?.roleTime ? timeFormat(roleData.roleTime) : "Навсегда";
		const text =
			`Вы собираетесь купить роль **<@&${roleData?.roleID}>** за \`${roleData?.rolePrice}\` ${config.emojis.SHARDS} на: \`${time}\` ⌚` +
			`Что бы подтвердить покупку, нажмите на ${config.emojis.CHECK}, для отмены на ${config.emojis.CROSS}`;

		const embed = new MessageEmbed()
			.setAuthor(
				message.author.username,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setDescription(text)
			.setColor(message.member?.displayColor!);

		const sendedMsg = await message.channel.send({
			content: message.author.toString(),
			embeds: [embed],
		});

		const CHECK = util.getEmoji(config.emojis.CHECK, Client);
		const CROSS = util.getEmoji(config.emojis.CROSS, Client);

		const emojis = [CHECK?.id, CROSS?.id];
		const filter = (reaction: MessageReaction, user: User) => {
			return emojis.includes(reaction.emoji.id!) && user.id === message.author.id;
		};

		for (let emote of emojis) {
			await sendedMsg.react(emote!);
		}

		maps.userInTask.set(message.author.id, undefined);

		sendedMsg
			.awaitReactions({ filter, time: 60000, errors: ["time"], max: 1 })
			.then(async collected => {
				const reaction = collected.first();
				sendedMsg.reactions.removeAll();
				switch (reaction?.emoji.id) {
					case CHECK?.id:
						const user = await userModel.findOne({
							uid: message.author.id,
						});

						if (user?.shards! < roleData?.rolePrice!) {
							await sendedMsg.delete();
							return util.errorMessage(message, {
								text: "У вас не хватает денег для покупки роли",
								reply: true,
							});
						}

						if (message.member?.roles.cache.some(r => checkRoles.includes(r.id))) {
							await sendedMsg.delete();
							return util.errorMessage(message, {
								text: "Вы не можете приобрести больше 1 роли",
								reply: true,
							});
						}

						await userModel.updateOne(
							{
								uid: message.author.id,
							},
							{
								$inc: {
									shards: -roleData?.rolePrice!,
								},
							}
						);

						message.member?.roles.add(roleData?.roleID!);
						await sendedMsg.delete();
						message.channel.send(
							`${message.author.toString()}, поздравляю с покупкой. Для дальнейших действий посмотрите \`${
								config.guildSettings.PREFIX
							}help activate\``
						);
						break;
					case CROSS?.id:
						await sendedMsg.delete();
						break;
				}

				maps.userInTask.delete(message.author.id);
			})
			.catch(async error => {
				await sendedMsg.delete();
				maps.userInTask.delete(message.author.id);
			});
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
