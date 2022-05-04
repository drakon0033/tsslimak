import { notifyModel } from "../../db/models/notify";
import { COMMAND, config } from "../../struct";

const cmd: COMMAND = {
	name: "dnotify",
	cooldown: 2,
	example: [""],
	helpInfo: "Команда для отключения уведомлений о получении капсулы",
	category: "Voice",
	permission: "User",
	run: async (Client, message, args) => {
		const alreadyDisabled = await notifyModel.findOne({
			uid: message.author.id,
		});

		if (alreadyDisabled) {
			await notifyModel.findOneAndDelete({
				uid: message.author.id,
			});
			message.channel.send(
				`${message.author.toString()}, теперь вы **будете** получать уведомления о получении ${
					config.emojis.CAPS
				}`
			);
		} else {
			await notifyModel.create({
				uid: message.author.id,
			});
			message.channel.send(
				`${message.author.toString()}, теперь вы **не будете** получать уведомления о получении ${
					config.emojis.CAPS
				}`
			);
		}
	},
};

export default cmd;
