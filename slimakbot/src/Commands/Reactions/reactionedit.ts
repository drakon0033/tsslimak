import { Reactions } from "../../db/models/reactions";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "reactionedit",
	cooldown: 2,
	aliases: ["redit"],
	example: [
		"redit обнять text %author% нежно обнял %target%",
		"redit спать solotext %author% в одиночестве засыпает...",
		"redit спать remove solotext",
	],
	helpInfo: "Команда для редактирования описания реакции",
	category: "Reactions",
	permission: "Moderator",
	run: async (Client, message, args) => {
		const reactionName = args[0];
		const type = args[1];

		if (!reactionName) {
			return util.errorMessage(message, {
				text: "Вы не указали название реакции",
				reply: true,
			});
		}

		const reaction = await Reactions.findOne({
			Name: reactionName,
		});

		if (!reaction) {
			return util.errorMessage(message, {
				text: `Реакция \`${reactionName}\` не найдена`,
				reply: true,
			});
		}

		if (!type) {
			return util.errorMessage(message, {
				text: "Вы не указали тип",
				reply: true,
			});
		}

		if (["remove"].includes(type)) {
			const textType = args[2];
			if (!["text", "solotext"].includes(textType)) {
				return util.errorMessage(message, {
					text: "Вы не указали тип текста, который хотите убрать",
					reply: true,
				});
			}

			switch (textType) {
				case "text":
					await Reactions.updateOne(
						{
							Name: reactionName,
						},
						{
							Text: undefined,
						}
					);
					break;
				case "solotext":
					await Reactions.updateOne(
						{
							Name: reactionName,
						},
						{
							SoloText: undefined,
						}
					);
					break;
			}

			message.channel.send(
				`Вы успешно сбросили **${textType}** у реакции **${reactionName}**`
			);

			return;
		}

		if (!["text", "solotext"].includes(type)) {
			return util.errorMessage(message, {
				text: "Вы не указали тип текста, `text` или `solotext`.",
				reply: true,
			});
		}

		const updateObj: { Text?: string; SoloText?: string } = {};

		switch (type) {
			case "text":
				updateObj.Text = args.slice(2, args.length).join(" ");
				break;
			case "solotext":
				updateObj.SoloText = args.slice(2, args.length).join(" ");
				break;
		}

		await Reactions.updateOne({ Name: reactionName }, updateObj);

		message
			.reply(`Реакция \`${reactionName}\` успешно обновлена`)
			.then(msg => util.deleteMessage(msg, 5000));
		message.delete();
	},
};

export default cmd;
