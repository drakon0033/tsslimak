import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const cmd: COMMAND = {
	name: "setstatus",
	cooldown: 2,
	aliases: ["статус"],
	example: ["setstatus text"],
	helpInfo: "Команда для редактирования статуса в вашем профиле",
	category: "General",
	permission: "User",
	run: async (Client, message, args) => {
		const reg = new RegExp(
			/(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-z]/g
		);
		const newStatus = args.join(" ");

		if (reg.test(newStatus) || !newStatus.length) {
			return util.errorMessage(message, {
				text: "К сожалению вы не можете установить такой статус",
				reply: true,
			});
		}

		await userModel.updateOne(
			{
				uid: message.author.id,
			},
			{
				status: newStatus,
			}
		);

		message.react(config.emojis.CHECK);
		message.channel.send(`${message.author.toString()}, вы успешно сменили свой статус.`);
	},
};

export default cmd;
