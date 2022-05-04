import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "setimage",
	cooldown: 2,
	example: [
		"setimage <https://images-ext-2.discordapp.net/external/3_xPvTqXDlSpYXTcRvHIhKSPbTwqQzy_juMZqxZLM_k/https/media.discordapp.net/attachments/707586279163953212/737953194436460564/giphy_4.gif>",
	],
	helpInfo: "Команда для смены картинки в профиле",
	category: "General",
	permission: "User",
	advancedInfo: `Команда для смены картинки в профиле. Стоимость услуги: \`2500\` ${config.emojis.SHARDS}`,
	run: async (Client, message, args) => {
		if (!args[0]) {
			await userModel.updateOne(
				{
					uid: message.author.id,
				},
				{
					picture:
						"https://media.discordapp.net/attachments/707586279163953212/737953194436460564/giphy_4.gif",
				}
			);

			return message.channel.send(
				`${message.author.toString()}, вы успешно сбросили картинку своего профиля на дефолтную.`
			);
		} else {
			const URL = args.join(" ");
			const regEx =
				/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

			if (!regEx.test(URL) && !/.gif|.png|.jpg/g.test(URL)) {
				return util.errorMessage(message, {
					text: "Вам нужно указать указать правильную ссылку. Она должна заканчиваться на `.gif .png .jpg`",
					reply: true,
					example: true,
					cmd,
				});
			}

			const user = await userModel.findOne({
				uid: message.author.id,
			});

			if (user?.shards! < 2500) {
				return util.errorMessage(message, {
					text: `У вас должно быть \`2500\` ${
						config.emojis.SHARDS
					} на балансе. Вам не хватает: ${2500 - user?.shards!} осколков.`,
					reply: true,
				});
			}

			await userModel.updateOne(
				{
					uid: message.author.id,
				},
				{
					picture: URL,
					$inc: {
						shards: -2500,
					},
				}
			);

			return message.channel.send(
				`${message.author.toString()}, вы успешно обновили картинку своего профиля.`
			);
		}
	},
};

export default cmd;
