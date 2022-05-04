import {
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
	MessageReaction,
	User,
} from "discord.js";
import { userModel } from "../../db/models/userModel";
import { logger } from "../../logger";
import { COMMAND, config, maps, util } from "../../struct";

const cmd: COMMAND = {
	name: "bet",
	cooldown: 2,
	aliases: ["ставка"],
	example: ["bet 10"],
	helpInfo: "Хотите потерять осколки? Вы знаете что делать",
	category: "Economy",
	permission: "User",
	advancedInfo: "Хотите потерять осколки? Вы знаете что делать. Ставка не меньше 10 осколков",
	run: async (Client, message, args) => {
		let user = await userModel.findOne({
			uid: message.author.id,
		})!;

		if (maps.userInBet.has(message.author.id) || maps.userInDuel.has(message.author.id)) {
			return util.errorMessage(message, {
				text: "Вам нужно завершить предыдущую ставку или дуэль, прежде чем делать ставку",
				reply: true,
			});
		}

		const betAmount = args[0] === "all" || args[0] === "все" ? user?.shards : Number(args[0]);

		if (!betAmount || betAmount < 10) {
			return util.errorMessage(message, {
				text: "Вам нужно указать кол-во осколков для совершения ставки",
				reply: true,
				example: true,
				cmd,
			});
		}

		if (user?.shards! < betAmount) {
			return util.errorMessage(message, {
				text: "У вас недостаточно осколков на счету",
				reply: true,
			});
		}

		const emojis = ["🌑", "🌕"];
		const botChoice = emojis[Math.floor(Math.random() * emojis.length)];
		const rnd = util.randomInt(0, 100);

		const embed = new MessageEmbed()
			.setAuthor(
				`Ставка пользователя: ${message.author.username}`,
				message.author.displayAvatarURL({ size: 2048, dynamic: true })
			)
			.setDescription(
				`Ты поставил \`${betAmount}\` ${config.emojis.SHARDS}.\n\nСейчас тебе нужно выбрать между \\🌑 и \\🌕\nВыиграешь или проиграешь - решит твоя удача.`
			)
			.setColor(message.member!.displayColor)
			.setThumbnail("https://i.imgur.com/Q4TJc4U.png")
			.setFooter(`У тебя есть всего 1 минута на выбор!`);
		const loseEmbed = new MessageEmbed()
			.setAuthor(`Проигрыш!`)
			.setColor("RED")
			.setFooter(`Если рандом выдал больше 85 - то ты проиграл автоматически. Цифра: ${rnd}.`)
			.setThumbnail("https://i.imgur.com/yIuXU6b.png");
		const winEmbed = new MessageEmbed()
			.setAuthor(`Победа!`)
			.setColor("GREEN")
			.setThumbnail("https://i.imgur.com/Zm5ZYRC.png");

		await userModel.updateOne(
			{
				uid: message.author.id,
			},
			{
				$inc: {
					shards: -betAmount,
				},
			}
		);

		maps.userInBet.set(message.author.id, undefined);
		user = await userModel.findOne({
			uid: message.author.id,
		});

		const selectButtons = new MessageActionRow().addComponents([
			new MessageButton().setCustomId("🌑").setLabel("🌑").setStyle("SECONDARY"),
			new MessageButton().setCustomId("🌕").setLabel("🌕").setStyle("SECONDARY"),
		]);

		const msg = await message.channel.send({
			content: message.author.toString(),
			embeds: [embed],
			components: [selectButtons],
		});

		const filter = (interaction: MessageComponentInteraction) => {
			if (interaction.user.id != message.author.id) {
				interaction.reply({ content: "Вы не вызывали эту команду :)", ephemeral: true });
				return false;
			}

			return emojis.includes(interaction.customId) && interaction.isButton();
		};

		const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

		collector.on("collect", async interaction => {
			if (rnd < 86 && interaction.customId === botChoice) {
				maps.userInBet.delete(message.author.id);

				await userModel.updateOne(
					{
						uid: message.author.id,
					},
					{
						$inc: {
							shards: betAmount * 2,
						},
					}
				);

				logger.message(`${message.author.username} выиграл ${betAmount} в ставке.`);

				interaction.update({
					content: message.member!.toString(),
					components: [],
					embeds: [
						winEmbed.setDescription(
							`Поздравляю с победой! Ты забираешь **\`${betAmount}\`** к себе на счёт.\n\nТвой выбор: \\${
								interaction.customId
							}, новый счёт: **\`${user!.shards! + betAmount * 2}\`** ${
								config.emojis.SHARDS
							}\nПравильный выбор: \\${botChoice}.`
						),
					],
				});

				collector.stop();
			} else {
				maps.userInBet.delete(message.author.id);
				logger.message(`${message.author.username} проиграл ${betAmount} в ставке.`);

				interaction.update({
					content: message.member!.toString(),
					components: [],
					embeds: [
						loseEmbed.setDescription(
							`К сожалению ты проиграл свою ставку.\n\nТы ставил: **\`${betAmount}\`** и выбрал \\${
								interaction.customId
							}, новый счёт: **\`${user!.shards!}\`** ${
								config.emojis.SHARDS
							}\nПравильный выбор был: \\${botChoice}.`
						),
					],
				});

				collector.stop();
			}
		});

		collector.on("end", async end => {
			if (!maps.userInBet.has(message.author.id)) return;
			await userModel.updateOne(
				{
					uid: message.author.id,
				},
				{
					$inc: {
						shards: betAmount,
					},
				}
			);
			maps.userInBet.delete(message.author.id);
		});
	},
};

export default cmd;
