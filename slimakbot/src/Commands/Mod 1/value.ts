import { GuildMember, Message, MessageEmbed, Snowflake } from "discord.js";
import { userModel } from "../../db/models/userModel";
import { COMMAND, config, util } from "../../struct";

const emojis = config.emojis;

const cmd: COMMAND = {
	name: "value",
	cooldown: 2,
	example: ["value @mention выдать s 100", "value userID установить c 10"],
	helpInfo: `Команда для редактирования кол-ва ${emojis.SHARDS}, ${emojis.CAPS}, ${emojis.PART} участника`,
	category: "Mod 1",
	permission: "Admin",
	advancedInfo: "s - shards, c - capsuls, p - particles",
	run: async (Client, message, args) => {
		const member = await util.getDiscordMember(message, {
			uid: args[0] as Snowflake,
			returnNothing: true,
		});

		if (!member) {
			return util.errorMessage(message, {
				text: "Вам нужно упомянуть участника или указать его ID",
				reply: true,
			});
		}

		const acts = ["забрать", "выдать", "установить"];
		const types = ["s", "c", "p"];

		const act = args[1];
		const type = args[2];

		const amount = Number(args[3]);

		if (isNaN(amount) || amount < 0) {
			return util.errorMessage(message, {
				text: "Вы указали неверное число, либо оно меньше 0",
				reply: true,
			});
		}
		if (member.user.bot) {
			return util.errorMessage(message, {
				text: "Вы не можете редактировать инвентарь боту",
				reply: true,
			});
		}
		if (!acts.includes(act) || !types.includes(type)) {
			return util.errorMessage(message, {
				text: "Вы указали неверное действие, или вещь, которую хотите редактировать",
				reply: true,
			});
		}

		switch (act) {
			case "забрать":
				reply(await remove(type, member, amount), {
					act,
					message,
					target: member,
					type,
				});
				break;
			case "выдать":
				reply(await add(type, member, amount), {
					act,
					message,
					target: member,
					type,
				});
				break;
			case "установить":
				reply(await set(type, member, amount), {
					act,
					message,
					target: member,
					type,
				});
				break;
		}
	},
};

function reply(returnedValue: returnedObj, options: options) {
	const { message, target, act, type } = options;
	const { newVal, oldVal } = returnedValue;

	const humanReadable = {
		s: `осколков ${emojis.SHARDS}`,
		p: `партиклов ${emojis.PART}`,
		c: `капсул ${emojis.CAPS}`,
	};

	const replyEmbed = new MessageEmbed()
		.setColor(message.member?.displayColor!)
		.setDescription(
			`${message.member?.toString()} изменил значение ваших ${
				humanReadable[type]
			} с \`${oldVal}\` на \`${newVal}\``
		);

	message.channel.send({ content: target.toString(), embeds: [replyEmbed] });
}

async function remove(type: string, target: GuildMember, amount: number): Promise<returnedObj> {
	const userData = await userModel.findOne({
		uid: target.id,
	});

	const returnedObj: returnedObj = { oldVal: 0, newVal: 0 };

	switch (type) {
		case "s":
			amount = userData?.shards! - amount < 0 ? 0 : amount;
			await userModel.updateOne(
				{ uid: target.id },
				{
					$inc: {
						shards: -amount,
					},
				}
			);
			returnedObj.oldVal = userData?.shards!;
			returnedObj.newVal = userData?.shards! - amount;
			break;
		case "p":
			amount = userData?.inventory?.particles! - amount < 0 ? 0 : amount;
			await userModel.updateOne(
				{ uid: target.id },
				{
					$inc: {
						"inventory.particles": -amount,
					},
				}
			);
			returnedObj.oldVal = userData?.inventory?.particles!;
			returnedObj.newVal = userData?.inventory?.particles! - amount;
			break;
		case "c":
			amount = userData?.inventory?.capsuls! - amount < 0 ? 0 : amount;
			await userModel.updateOne(
				{ uid: target.id },
				{
					$inc: {
						"inventory.capsuls": -amount,
					},
				}
			);
			returnedObj.oldVal = userData?.inventory?.capsuls!;
			returnedObj.newVal = userData?.inventory?.capsuls! - amount;
			break;
	}

	return returnedObj;
}

async function add(type: string, target: GuildMember, amount: number): Promise<returnedObj> {
	const userData = await userModel.findOne({
		uid: target.id,
	});

	const returnedObj: returnedObj = { oldVal: 0, newVal: 0 };

	switch (type) {
		case "s":
			await userModel.updateOne(
				{ uid: target.id },
				{
					$inc: {
						shards: amount,
					},
				}
			);
			returnedObj.oldVal = userData?.shards!;
			returnedObj.newVal = userData?.shards! + amount;
			break;
		case "p":
			await userModel.updateOne(
				{ uid: target.id },
				{
					$inc: {
						"inventory.particles": amount,
					},
				}
			);
			returnedObj.oldVal = userData?.inventory?.particles!;
			returnedObj.newVal = userData?.inventory?.particles! + amount;
			break;
		case "c":
			await userModel.updateOne(
				{ uid: target.id },
				{
					$inc: {
						"inventory.capsuls": amount,
					},
				}
			);
			returnedObj.oldVal = userData?.inventory?.capsuls!;
			returnedObj.newVal = userData?.inventory?.capsuls! + amount;
			break;
	}

	return returnedObj;
}

async function set(type: string, target: GuildMember, amount: number): Promise<returnedObj> {
	const userData = await userModel.findOne({
		uid: target.id,
	});

	const returnedObj: returnedObj = { oldVal: 0, newVal: 0 };

	switch (type) {
		case "s":
			amount = amount < 0 ? 0 : amount;
			await userModel.updateOne(
				{ uid: target.id },
				{
					$set: {
						shards: amount,
					},
				}
			);
			returnedObj.oldVal = userData?.shards!;
			returnedObj.newVal = amount;
			break;
		case "p":
			amount = amount < 0 ? 0 : amount;
			await userModel.updateOne(
				{ uid: target.id },
				{
					$set: {
						"inventory.particles": amount,
					},
				}
			);
			returnedObj.oldVal = userData?.inventory?.particles!;
			returnedObj.newVal = amount;
			break;
		case "c":
			amount = amount < 0 ? 0 : amount;
			await userModel.updateOne(
				{ uid: target.id },
				{
					$set: {
						"inventory.capsuls": amount,
					},
				}
			);
			returnedObj.oldVal = userData?.inventory?.capsuls!;
			returnedObj.newVal = amount;
			break;
	}

	return returnedObj;
}

type returnedObj = {
	oldVal: number;
	newVal: number;
};

type options = {
	target: GuildMember;
	act: string;
	type: string;
	message: Message;
};

export default cmd;
