import { Reactions } from "../../db/models/reactions";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "reactionremovegif",
	cooldown: 2,
	aliases: ["rremovegif"],
	example: ["rremovegif reactionName linkToGif"],
	helpInfo: "Команда для того что бы убрать гифку из списка у реакции",
	category: "Reactions",
	permission: "Moderator",
	run: async (Client, message, args) => {
		const reaction = args[0];
		const gifLink = args.slice(1, args.length).join(" ");

		const reactionObj = await Reactions.findOne({
			Name: reaction,
		});

		if (!reaction) {
			return util.errorMessage(message, {
				text: "Такой реакции в базе нет",
				reply: true,
			});
		}

		if (!reactionObj?.Gifs?.includes(gifLink)) {
			return util.errorMessage(message, {
				text: "Этой гифки нет в списке гифок этой реакции",
				reply: true,
			});
		}

		await Reactions.updateOne(
			{
				Name: reactionObj.Name,
			},
			{
				Gifs: reactionObj.Gifs.filter(gif => gif != gifLink),
			}
		);

		message
			.reply(`Гифка успешно была убрана из списка гифок у этой реакции`)
			.then(m => util.deleteMessage(m, 5000));
		message.delete();
	},
};

export default cmd;
