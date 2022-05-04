import { Message, Snowflake } from "discord.js";
import { guildSettings } from "../../db/models/guildSettings";
import { COMMAND, config, util } from "../../struct";

const fields = ["name", "luvName", "luvCat", "voiceCat", "channelCreate"];

const cmd: COMMAND = {
	name: "voice-config",
	cooldown: 2,
	aliases: ["войс-конфиг", "вкфг"],
	example: ["voice-config name New Voice", "вкфг voiceCat categoryID"],
	helpInfo: "Команда для настройки автоматических войсов",
	category: "Guild Settings",
	permission: "Admin",
	advancedInfo: `Доступные поля для редактирования:\n${fields.map(field => `\`${field}\``)}`,
	run: async (Client, message, args) => {
		const type = args[0];

		if (!fields.includes(type)) {
			return util.errorMessage(message, {
				text: `Вы указали неверное поле, которое хотите изменить. Посмотрите \`${config.guildSettings.PREFIX}help ${cmd.name}\``,
				reply: true,
			});
		}

		const fieldsObj = {
			name: editName,
			luvName: editLuvName,
			luvCat: editLuvCat,
			voiceCat: editVoiceCat,
			channelCreate: editChannelCreate,
		};

		fieldsObj[type](args, message);
	},
};

async function editName(args: string[], msg: Message) {
	const name = args.slice(1).join(" ");

	if (!name) {
		return util.errorMessage(msg, {
			text: "Вы забыли указать название для новых создаваемых каналов",
			reply: true,
		});
	}

	await guildSettings.updateOne(
		{ gid: msg.guild?.id },
		{
			vName: name,
		}
	);

	msg.reply(`Дефолтное название приватных каналов было изменено на: **${name}**`);
}

async function editLuvName(args: string[], msg: Message) {
	const name = args.slice(1).join(" ");

	if (!name) {
		return util.errorMessage(msg, {
			text: "Вы забыли указать название для новых создаваемых каналов",
			reply: true,
		});
	}

	await guildSettings.updateOne(
		{ gid: msg.guild?.id },
		{
			vLuvName: name,
		}
	);

	msg.reply(`Дефолтное название любовных каналов было изменено на: **${name}**`);
}

async function editLuvCat(args: string[], msg: Message) {
	const ID = args[1] as Snowflake;
	const channel = msg.guild?.channels.cache.get(ID);

	if (channel?.type != "GUILD_CATEGORY") {
		return util.errorMessage(msg, {
			text: "Вы указали неверную категорию",
			reply: true,
		});
	}

	await guildSettings.updateOne(
		{ gid: msg.guild?.id },
		{
			vLuvCat: channel.id,
		}
	);

	msg.reply(`Любовные каналы будут создаваться в: **${channel.name}** категории`);
}

async function editVoiceCat(args: string[], msg: Message) {
	const ID = args[1] as Snowflake;
	const channel = msg.guild?.channels.cache.get(ID);

	if (channel?.type != "GUILD_CATEGORY") {
		return util.errorMessage(msg, {
			text: "Вы указали неверную категорию",
			reply: true,
		});
	}

	await guildSettings.updateOne(
		{ gid: msg.guild?.id },
		{
			vCat: channel.id,
		}
	);

	msg.reply(`Приватные каналы будут создаваться в: **${channel.name}** категории`);
}

async function editChannelCreate(args: string[], msg: Message) {
	const ID = args[1] as Snowflake;
	const channel = msg.guild?.channels.cache.get(ID);

	if (channel?.type != "GUILD_VOICE") {
		return util.errorMessage(msg, {
			text: "Вы указали неверный голосовой канал",
			reply: true,
		});
	}

	await guildSettings.updateOne(
		{ gid: msg.guild?.id },
		{
			vChannelCreate: channel.id,
		}
	);

	msg.reply(`Теперь что бы создать приватный канал, нужно будет войти в: **${channel.name}**`);
}

export default cmd;
