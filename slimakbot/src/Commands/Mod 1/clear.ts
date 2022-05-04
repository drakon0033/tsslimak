import { GuildMember, Message, Snowflake, TextChannel } from "discord.js";
import { COMMAND, util } from "../../struct";

const cmd: COMMAND = {
	name: "clear",
	cooldown: 2,
	aliases: ["очистить"],
	example: ["clear 100", "clear @mention 100"],
	helpInfo: "Команда для очистки сообщений в чате",
	category: "Mod 1",
	permission: "Moderator",
	run: async (Client, message, args) => {
		await message.delete();
		const target = await util.getDiscordMember(message, {
			returnNothing: true,
			uid: args[0] as Snowflake,
		})!;

		const amount = isNaN(Number(args[0])) ? Number(args[1]) : Number(args[0]);

		if (!amount || amount < 1) {
			return util.errorMessage(message, {
				text: "Вы забыли указать кол-во сообщений, которые будут удалены",
				reply: true,
			});
		}

		const msgsToDelete: Message[] = [];
		if (!target) {
			await collectMessages(message.channel as TextChannel, {
				need: amount,
				putIn: msgsToDelete,
			});
		} else {
			await collectMessages(message.channel as TextChannel, {
				need: amount,
				putIn: msgsToDelete,
				target,
			});
		}

		const channel = message.channel as TextChannel;
		try {
			const deleted = await channel.bulkDelete(msgsToDelete, true);
			message.channel
				.send(`${message.author.toString()}, было удалено \`${deleted.size}\` 📝 сообщений`)
				.then(m => util.deleteMessage(m, 5000));
		} catch (error) {
			util.DiscordErrorHandler(error, {
				cmd,
				message,
			});
			message.channel.send(
				`${message.author.toString()}, я не могу удалить сообщения, которые старше 14 дней!`
			);
		}
	},
};

async function collectMessages(channel: TextChannel, options: collectMessagesOptions) {
	const { need, before, target, putIn } = options;

	const limit = 50;

	const collected = before
		? await channel.messages.fetch({ limit, before })
		: await channel.messages.fetch({ limit });
	const filteredMessages = target
		? collected.filter(m => m.author.id === target.id).map(m => m)
		: collected.map(m => m);

	if (filteredMessages.length) {
		for (let i = 0; i < need && putIn.length != need; i++) {
			if (filteredMessages[i]) {
				putIn.push(filteredMessages[i]);
			} else {
				break;
			}
		}
	}

	options.before = putIn.length != need ? collected.last()?.id : undefined;
	if (options.before) {
		await collectMessages(channel, options);
	} else {
		return;
	}
}

interface collectMessagesOptions {
	need: number;
	putIn: Message[];
	target?: GuildMember;
	before?: Snowflake;
}

export default cmd;
