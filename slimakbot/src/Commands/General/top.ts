import { COMMAND, config, util } from "../../struct";
import { MessageEmbed, Message, MessageReaction, User } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { IUser } from "../../db/types/user";
import moment from "moment";

const reactions: { [s: string]: string } = {
	0: "<a:cup1:700519119430221865>",
	1: "<a:cup2:700519119975350353>",
	2: "<a:cup3:700519119782674453>",
};

const cmd: COMMAND = {
	name: "top",
	cooldown: 2,
	aliases: ["топ"],
	example: ["top vt"],
	helpInfo: "Команда для отображения топа участников",
	category: "General",
	permission: "User",
	advancedInfo: "Команда для отображения топа участников, доступные топы: `vt, msg, lvl, shards`",
	run: async (Client, message, args) => {
		if (args[0] && !["msg", "lvl", "shards", "vt"].includes(args[0])) {
			return util.errorMessage(message, {
				text: `Вы указали неправильный топ. Доступные \`msg\`, \`lvl\`, \`shards\`, \`vt\``,
				reply: true,
			});
		}

		const topEmbed = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setImage(
				"https://i.pinimg.com/originals/52/cb/64/52cb6425a0816e9ec0b94f1049bd26c0.jpg"
			);

		if (args[0]) {
			await generateTop(topEmbed, message, args[0]);
			return message.channel.send({ content: message.author.toString(), embeds: [topEmbed] });
		}

		message.delete();

		const msgEmoji = util.getEmoji(config.emojis.MESSAGES, Client);
		const lvlEmoji = util.getEmoji(config.emojis.LVL, Client);
		const shardsEmoji = util.getEmoji(config.emojis.SHARDS, Client);
		const voiceEmoji = util.getEmoji(config.emojis.MICRO, Client);
		const crossEmoji = util.getEmoji(config.emojis.CROSS, Client);

		const emojis = [
			msgEmoji?.id,
			lvlEmoji?.id,
			shardsEmoji?.id,
			voiceEmoji?.id,
			crossEmoji?.id,
		];

		const filter = (reaction: MessageReaction, user: User) => {
			return emojis.includes(reaction.emoji.id!) && user.id === message.author.id;
		};

		const embed = new MessageEmbed()
			.setColor(message.member?.displayColor!)
			.setDescription(
				`Выберите один из **4** доступных топов\n\n${msgEmoji} - топ сообщений\n${lvlEmoji} - топ уровня\n${shardsEmoji} - топ осколков\n${voiceEmoji} - топ войс-онлайна`
			)
			.setImage(
				"https://i.pinimg.com/originals/1f/39/1a/1f391aea4f79fa0ddd06a0b0833b6e2b.png"
			);
		const sentMsg = await message.channel.send({
			content: message.author.toString(),
			embeds: [embed],
		});

		for (const emote of emojis) {
			await sentMsg.react(emote!);
		}

		const collector = await sentMsg.createReactionCollector({ filter, time: 60000 });
		collector.on("collect", async onReact => {
			const emoji = onReact.emoji;
			let str;
			switch (emoji.id) {
				case msgEmoji?.id:
					str = "msg";
					break;
				case lvlEmoji?.id:
					str = "lvl";
					break;
				case shardsEmoji?.id:
					str = "shards";
					break;
				case voiceEmoji?.id:
					str = "vt";
					break;
			}
			if (emoji.id === crossEmoji?.id) return collector.stop();
			onReact.users.remove(message.author.id);
			if (str === sentMsg.embeds[0].author?.name?.split(" ")[1]) return;
			await generateTop(topEmbed, message, str);
			sentMsg.edit({ content: message.author.toString(), embeds: [topEmbed] });
		});
		collector.on("end", async collected => {
			if (sentMsg.deleted) return;
			await sentMsg.delete();
		});
	},
};

async function generateTop(embed: MessageEmbed, msg: Message, top: string) {
	if (embed.fields.length) embed.fields = [];
	const findTop = {
		lvl: async () => {
			return await userModel.find({}, { uid: 1, xp: 1, lvl: 1, _id: 0 }).sort({ xp: 1 });
		},
		msg: async () => {
			return await userModel.find({}, { uid: 1, messages: 1, _id: 0 }).sort({ messages: 1 });
		},
		shards: async () => {
			return await userModel.find({}, { uid: 1, shards: 1, _id: 0 }).sort({ shards: 1 });
		},
		vt: async () => {
			return await userModel
				.find({}, { uid: 1, "voice.allTime": 1, _id: 0 })
				.sort({ "voice.allTime": 1 });
		},
	};

	const dbArray: IUser[] = await findTop[top]();
	const array = dbArray.filter(entry => entry.uid != msg.client.user?.id).reverse();
	const members: string[] = [];
	for (const idx in array) {
		const index = Number(idx);
		if (index > 8) break;
		const user = array[index];
		const position = reactions[index] ? reactions[index] : `#${index + 1}`;
		const str = getStr(user);

		members.push(user.uid!);

		try {
			const member = await msg.guild?.members.fetch(user.uid!);
			embed.addField(`${position} ${member?.user.username}`, str, true);
		} catch (error) {
			embed.addField(`${position} 👻`, str, true);
		}
	}

	embed.setAuthor(`Топ ${top}`, msg.author.displayAvatarURL({ size: 2048, dynamic: true }));

	if (!members.includes(msg.author.id)) {
		const authorPosition = array.findIndex(data => data.uid === msg.author.id);
		const str = getStr(array[authorPosition]);

		embed.addFields(
			{ name: "\u200B", value: "\u200B", inline: true },
			{
				name: `#${authorPosition + 1} ${msg.author.username}`,
				value: str,
				inline: true,
			},
			{ name: "\u200B", value: "\u200B", inline: true }
		);
	}
}

function getStr(user: IUser) {
	return `**\`\`\`xl\n${
		user.lvl
			? user.lvl
			: user.messages
			? user.messages
			: user.shards
			? user.shards
			: user.voice?.allTime
			? timeFormat(user.voice.allTime)
			: 0
	}\`\`\`**`;
}

// async function genEmbed(embed: MessageEmbed, array: IUser[], msg: Message) {}

function timeFormat(time: number) {
	const duration = moment.duration(time);

	const minutes = duration.minutes();
	const hours = Math.floor(duration.asHours()); // duration.hours();

	const sHours = hours < 10 ? `00${hours}` : hours < 100 ? `0${hours}` : hours;
	const sMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

	return sHours + "ч " + sMinutes + "м";
}

export default cmd;
