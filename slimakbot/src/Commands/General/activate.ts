import { COMMAND, config, maps, util } from "../../struct";
import moment from "moment";
import { activatedRoles } from "../../db/models/activatedRoles";
import {
	Client,
	ColorResolvable,
	Message,
	MessageEmbed,
	MessageReaction,
	Role,
	User,
} from "discord.js";
import { colorShop } from "../../db/models/colorShop";
import { IColorShop } from "../../db/types/colorShop";

const cmd: COMMAND = {
	name: "activate",
	cooldown: 2,
	aliases: ["активировать"],
	example: ["activate 1 #hexcode"],
	helpInfo: "Команда для активации различных вещей",
	category: "General",
	permission: "User",
	advancedInfo:
		"Команда для активации различных вещей на сервере, таких как ролей с цветом, и т.д\nСписок айтемов:\n1 - цвет (узнать хекс код [тык](https://www.google.com/search?q=hex+color))",
	run: async (Client, message, args) => {
		const item = args[0];

		const itemFunctions = {
			"1": colorItem,
		};

		if (!itemFunctions[item]) {
			return util.errorMessage(message, {
				text: "Вы не указали `item` который хотите активировать",
				example: true,
				cmd,
				reply: true,
			});
		}

		itemFunctions[item](message, args, Client);
	},
};

async function colorItem(message: Message, args: string[], client: Client) {
	const alreadyHas = (await activatedRoles.findOne({
		uid: message.author.id,
	}))
		? true
		: false;

	if (alreadyHas) {
		return util.errorMessage(message, {
			text: "К сожалению вы не можете иметь одновременно 2 активных временных роли",
			reply: true,
		});
	}

	if (!args[1] || !args[1].startsWith("#")) {
		return util.errorMessage(message, {
			text: "Вы указали неверный `HEX` код",
			reply: true,
		});
	}

	const checkRoles = [
		"719016288248135681",
		"719016291653910557",
		"719016294799900783",
		"719016296674623571",
		"719016298641883226",
	];

	const checkedRole = message.member?.roles.cache.find(r => checkRoles.includes(r.id));

	if (!checkedRole) {
		return util.errorMessage(message, {
			text: `У вас нет одной из **5** ролей, которые нужны для активации своего цвета. Для покупки, посмотрите \`${config.guildSettings.PREFIX}colorshop\``,
			reply: true,
		});
	}

	if (maps.userInTask.has(message.author.id)) {
		return util.errorMessage(message, {
			text: "Вы должны завершить прошлую активацию цвета, или любое другое активное действие",
			reply: true,
		});
	}

	const roleData = await colorShop.findOne({
		roleID: checkedRole.id,
	});

	const time = roleData?.roleTime ? timeFormat(Number(roleData.roleTime)) : "Навсегда.";
	const color = args[1];
	const previewRole = await message.guild?.roles.create({
		name: `Prev. C. ${message.author.tag}`,
		color: color as ColorResolvable,
	});

	let previewEmbedText =
		`При нажатии на ${
			config.emojis.CHECK
		} вы получите цвет **${previewRole?.toString()}** на \`${time}\`` +
		`\nПри нажатии на ${config.emojis.CROSS}, вы отмените действие, и сможете активировать роль позже.`;
	const previewEmbed = new MessageEmbed()
		.setAuthor(
			message.author.username,
			message.author.displayAvatarURL({ size: 2048, dynamic: true })
		)
		.setColor(message.member?.displayColor!)
		.setFooter(`У вас есть 1 минута на принятие решения`)
		.setDescription(previewEmbedText);

	const previewMessage = await message.channel.send({
		content: message.author.toString(),
		embeds: [previewEmbed],
	});
	maps.userInTask.set(message.author.id, undefined);

	const CHECK = util.getEmoji(config.emojis.CHECK, client);
	const CROSS = util.getEmoji(config.emojis.CROSS, client);

	const reactions = [CHECK?.id, CROSS?.id];

	for (const emote of reactions) {
		await previewMessage.react(emote!);
	}

	const filter = (reaction: MessageReaction, user: User) => {
		return user.id === message.author.id && reactions.includes(reaction.emoji.id!);
	};

	previewMessage
		.awaitReactions({ filter, time: 60000, errors: ["time"], max: 1 })
		.then(async collected => {
			const reaction = collected.first();

			switch (reaction?.emoji.id) {
				case CHECK?.id:
					previewMessage.reactions.removeAll();

					const createdRole = await message.guild?.roles.create({
						name: "COLOR",
						color: color as ColorResolvable,
						position: message.guild.roles.cache.size - 3,
					});

					createCustomRole(message, roleData!, createdRole!);

					message.member?.roles.remove(checkedRole);
					message.member?.roles.add(createdRole!);

					previewEmbedText =
						`Поздравляю с активацией!` +
						`\nВы получаете цвет **${createdRole?.toString()}** на \`${time}\`.`;

					previewMessage.edit({
						content: message.author.toString(),
						embeds: [previewEmbed.setDescription(previewEmbedText).setFooter("")],
					});

					previewRole?.delete();
					break;
				case CROSS?.id:
					previewEmbedText = `Вы успешно отменили операцию.`;
					previewMessage.edit({
						content: message.author.toString(),
						embeds: [previewEmbed.setDescription(previewEmbedText).setFooter("")],
					});
					previewRole!.delete();
					break;
			}

			maps.userInTask.delete(message.author.id);
		})
		.catch(error => {
			previewMessage.edit(
				`${message.author.toString()}, время вышло, или при выполнении команды произошла ошибка.`
			);
			previewRole?.delete();
			maps.userInTask.delete(message.author.id);
		});
}

async function createCustomRole(message: Message, roleData: IColorShop, createdRole: Role) {
	if (roleData.roleTime) {
		await activatedRoles.create({
			uid: message.author.id,
			roleID: createdRole.id,
			removeTime: roleData.roleTime + new Date().getTime(),
		});
	} else {
		await activatedRoles.create({
			uid: message.author.id,
			roleID: createdRole.id,
		});
	}
}

function timeFormat(time: number) {
	const duration = moment.duration(time);

	const hours = duration.hours();
	const days = Math.floor(duration.asDays());
	const sHours = hours < 10 ? `0${hours}` : `${hours}`;
	const sDays = days < 10 ? `0${days}` : `${days}`;

	return sDays + "д " + sHours + "ч";
}

export default cmd;
