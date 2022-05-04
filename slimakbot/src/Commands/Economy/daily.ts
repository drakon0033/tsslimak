import { GuildMember, MessageEmbed } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config } from "../../struct";
import moment from "moment";

const cmd: COMMAND = {
	name: "daily",
	cooldown: 2,
	permission: "User",
	category: "Economy",
	aliases: ["дань", "бонус"],
	helpInfo: "Команда для получения 12ти часового бонуса",
	example: ["daily"],
	run: async (Client, message, args) => {
		let toAdd = 50;

		const { totalBonus, bonusText } = addionalShards(message.member!);

		const user = await userModel.findOne({
			uid: message.author.id,
		});

		const text =
			`Вот твой 12-ти часовой бонус в размере **\`${toAdd}\`** + **\`${totalBonus}\`** бонусных ${config.emojis.SHARDS}` +
			`\nТвой баланс теперь составляет: \`${user!.shards! + toAdd + totalBonus}\` ${
				config.emojis.SHARDS
			}` +
			`\n\`Бонусы за след. роли:\`\n${bonusText}`;

		if (user?.daily && Number(user.daily) < new Date().getTime()) {
			const rewardEmbed = new MessageEmbed()
				.setThumbnail("https://i.imgur.com/PzdfLK8.png")
				.setAuthor(
					`Бонусная награда.`,
					message.guild!.iconURL({ size: 2048, dynamic: true })!
				)
				.setColor(message.member!.displayColor)
				.setFooter(`Следующий бонус ты сможешь забрать через 12 часов.`)
				.setDescription(text);

			await userModel.updateOne(
				{
					uid: message.author.id,
				},
				{
					$inc: {
						shards: toAdd + totalBonus,
					},
					daily: String(new Date().getTime() + 43200000),
				}
			);

			return message.channel.send({
				content: message.author.toString(),
				embeds: [rewardEmbed],
			});
		} else if (user?.daily) {
			const waitEmbed = new MessageEmbed()
				.setThumbnail("https://i.imgur.com/D9ZNHgn.png")
				.setAuthor(
					`Бонусная награда. Время еще не пришло!`,
					message.guild!.iconURL({ size: 2048, dynamic: true })!
				)
				.setColor(message.member!.displayColor)
				.setDescription(
					`Твой бонус еще не готов.\n\nТебе осталось подождать: **\`${timeFormat(
						Number(user.daily) - new Date().getTime()
					)}\`** до след. бонуса.`
				);
			return message.channel.send({
				content: message.author.toString(),
				embeds: [waitEmbed],
			});
		} else {
			const rewardEmbed = new MessageEmbed()
				.setThumbnail("https://i.imgur.com/PzdfLK8.png")
				.setAuthor(
					`Бонусная награда.`,
					message.guild!.iconURL({ size: 2048, dynamic: true })!
				)
				.setColor(message.member!.displayColor)
				.setFooter(`Следующий бонус ты сможешь забрать через 12 часов.`)
				.setDescription(text);

			await userModel.updateOne(
				{
					uid: message.author.id,
				},
				{
					$inc: {
						shards: toAdd + totalBonus,
					},
					daily: String(new Date().getTime() + 43200000),
				}
			);

			return message.channel.send({
				content: message.author.toString(),
				embeds: [rewardEmbed],
			});
		}
	},
};

function addionalShards(member: GuildMember): { totalBonus: number; bonusText: string } {
	const shard = config.emojis.SHARDS;

	const bonusRoles = {
		"647729651854082058": {
			amount: 5,
			text: `**<@&647729651854082058>** - 5 ${shard}\n`,
		},
		"653700199453032478": {
			amount: 10,
			text: `**<@&653700199453032478>** - 10 ${shard}\n`,
		},
		"653700212518551583": {
			amount: 15,
			text: `**<@&653700212518551583>** - 15 ${shard}\n`,
		},
		"653700214913237022": {
			amount: 20,
			text: `**<@&653700214913237022>** - 20 ${shard}\n`,
		},
		"653700217228623873": {
			amount: 25,
			text: `**<@&653700217228623873>** - 25 ${shard}\n`,
		},
		"651553004587057162": {
			amount: 30,
			text: `**<@&651553004587057162>** - 30 ${shard}\n`,
		},
		"747530367065391129": {
			amount: 50,
			text: `**<@&747530367065391129>** - 50 ${shard}\n`,
		},
		"589091264264142848": {
			amount: 50,
			text: `**<@&589091264264142848>** - 50 ${shard}\n`,
		},
		"719014938437222422": {
			amount: 15,
			text: `**<@&719014938437222422>** - 15 ${shard}\n`,
		},
		"719014559947685928": {
			amount: 15,
			text: `**<@&719014559947685928>** - 15 ${shard}\n`,
		},
		"704184889569968180": {
			amount: 15,
			text: `**<@&704184889569968180>** - 15 ${shard}\n`,
		},
	};

	let totalBonus = 0;
	let bonusText = ``;

	member.roles.cache
		.sort((a, b) => b.position - a.position)
		.forEach(role => {
			if (bonusRoles[role.id]) {
				const bonus = bonusRoles[role.id];
				totalBonus += bonus.amount;
				bonusText += bonus.text;
			}
		});

	return {
		totalBonus,
		bonusText,
	};
}

function timeFormat(time: number) {
	const duration = moment.duration(time);
	const seconds = duration.seconds();
	const minutes = duration.minutes();
	const hours = duration.hours();
	const sMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
	const sSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
	if (hours != 0) {
		return `${hours}ч ${sMinutes}м`;
	} else if (minutes != 0) {
		return `${minutes}м ${sSeconds}с`;
	} else {
		return `${seconds}с`;
	}
}

export default cmd;
