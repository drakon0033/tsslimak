import { Message, MessageEmbed, User } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { IUser } from "../../db/types/user";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "open",
	category: "Economy",
	permission: "User",
	cooldown: 2,
	helpInfo: "Команда для открытия капсул",
	example: ["open", "open all/все", "open 10"],
	aliases: ["открыть"],
	run: async (Client, message, args) => {
		const user = await userModel.findOne({
			uid: message.author.id,
		});

		const totalCapsuls = user?.inventory?.capsuls;
		const act = args[0];

		if (!totalCapsuls) {
			return util.errorMessage(message, {
				text: "У вас нет капсул что бы их открывать",
				reply: true,
			});
		}

		switch (act) {
			case "все":
				openAllCapsuls(user!, totalCapsuls, message);
				break;
			case "all":
				openAllCapsuls(user!, totalCapsuls, message);
				break;
			default:
				if (!act) {
					openCapsuls(user!, 1, message);
				} else if (!Number.isNaN(Number(act))) {
					openCapsuls(user!, Number(args[0]), message);
				} else {
					util.errorMessage(message, {
						text: "Вы не указали кол-во капсул для открытия",
						reply: true,
					});
				}
				break;
		}
	},
};

async function openCapsuls(user: IUser, toOpen: number, message: Message) {
	let totalShards = 0;
	if (toOpen > 1) {
		for (let i = 1; i <= toOpen; i++) {
			totalShards += util.randomInt(10, 100);
		}
	} else if (toOpen === 1) {
		totalShards = util.randomInt(10, 100);
	}

	await userModel.updateOne(
		{
			uid: message.author.id,
		},
		{
			$inc: {
				shards: totalShards,
				"inventory.capsuls": -toOpen,
			},
		}
	);

	const text =
		`Вы открыли \`${toOpen}\` ${config.emojis.CAPS} и получили \`${totalShards}\` ${config.emojis.SHARDS}` +
		`\n\nКол-во осколков на вашем балансе: \`${user.shards! + totalShards}\` ${
			config.emojis.SHARDS
		}, капсул: \`${user.inventory?.capsuls! - toOpen}\`. ${config.emojis.CAPS}`;
	const replyEmbed = new MessageEmbed()
		.setAuthor(`Открытие капсулы!`, message.guild?.iconURL({ size: 2048, dynamic: true })!)
		.setDescription(text)
		.setThumbnail("https://i.imgur.com/uX85fIE.png")
		.setColor(message.member?.displayColor!);

	message.channel.send({ content: message.author.toString(), embeds: [replyEmbed] });
}

async function openAllCapsuls(user: IUser, totalAmount: number, message: Message) {
	let totalShards = 0;
	for (let i = 1; i <= totalAmount; i++) {
		totalShards += util.randomInt(10, 100);
	}

	await userModel.updateOne(
		{
			uid: message.author.id,
		},
		{
			$inc: {
				shards: totalShards,
			},
			$set: {
				"inventory.capsuls": 0,
			},
		}
	);

	const text =
		`Вы открыли \`${totalAmount}\` ${config.emojis.CAPS} и получили \`${totalShards}\` ${config.emojis.SHARDS}` +
		`\n\nКол-во осколков на вашем балансе: \`${user.shards! + totalShards}\` ${
			config.emojis.SHARDS
		}, капсул: \`0\`. ${config.emojis.CAPS}`;
	const replyEmbed = new MessageEmbed()
		.setAuthor(`Открытие капсул!`, message.guild?.iconURL({ size: 2048, dynamic: true })!)
		.setDescription(text)
		.setThumbnail("https://i.imgur.com/uX85fIE.png")
		.setColor(message.member?.displayColor!);

	message.channel.send({ content: message.author.toString(), embeds: [replyEmbed] });
}

export default cmd;
