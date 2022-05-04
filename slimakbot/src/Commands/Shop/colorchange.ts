import { ColorResolvable, Message, MessageEmbed, Role } from "discord.js";
import moment from "moment";
import { activatedRoles } from "../../db/models/activatedRoles";
import { userModel } from "../../db/models/userModel";
import { IActivatedRoles } from "../../db/types/activatedRoles";
import { IUser } from "../../db/types/user";
import { COMMAND, config, maps, util } from "../../struct";

const cmd: COMMAND = {
	name: "colorchange",
	cooldown: 2,
	example: ["colorchange name clown", "colorchange color #313213"],
	helpInfo: "Команда для редактирования личной роли, стоимость **1000**" + config.emojis.SHARDS,
	category: "Shop",
	permission: "User",
	run: async (Client, message, args) => {
		const activatedRole = await activatedRoles.findOne({
			uid: message.author.id,
		});

		if (!activatedRole || activatedRole.removeTime) {
			return util.errorMessage(message, {
				text: "У вас нет активированой роли, либо она временная",
				reply: true,
			});
		}

		const userData = await userModel.findOne({
			uid: message.author.id,
		});
		const role = message.guild?.roles.cache.get(activatedRole.roleID!);

		maps.userInTask.set(message.author.id, undefined);

		const variations = {
			цвет: colorChange,
			color: colorChange,
			name: nameChange,
			название: nameChange,
		};

		if (!variations[args[0]]) {
			return util.errorMessage(message, {
				text: "Вы не указали что именно хотите поменять.\nДоступные `color, name`\nТак же доступные русские варианты `цвет, название`",
				reply: true,
			});
		}
		variations[args[0]](message, args, {
			role,
			roleData: activatedRole,
			user: userData!,
		});

		maps.userInTask.delete(message.author.id);
	},
};

async function colorChange(message: Message, args: string[], dataOptions: dataOptions) {
	const { user, roleData, role } = dataOptions;
	const currentTime = new Date().getTime();
	if (roleData.colorChange && roleData.colorChange > currentTime) {
		return util.errorMessage(message, {
			text: `Вам нужно подождать **\`${timeFormat(
				roleData.colorChange - currentTime
			)}\`** прежде вы сможете снова сменить цвет`,
			reply: true,
		});
	}

	if (user.shards! < 1000) {
		return util.errorMessage(message, {
			text: `Для смены цвета, у вас должно быть минимум \`1000\` ${config.emojis.SHARDS}`,
			reply: true,
		});
	}

	const color = args[1];

	if (!color || !color.startsWith("#")) {
		return util.errorMessage(message, {
			text: "Вы указали неверный **HEX** код",
			reply: true,
		});
	}

	role.setColor(color as ColorResolvable);

	await userModel.updateOne(
		{ uid: message.author.id },
		{
			$inc: {
				shards: -1000,
			},
		}
	);

	await activatedRoles.updateOne(
		{ uid: message.author.id },
		{
			colorChange: new Date().getTime() + 1296000000, // 30 days
		}
	);

	const embed = new MessageEmbed()
		.setAuthor(
			message.author.username,
			message.author.displayAvatarURL({ size: 2048, dynamic: true })
		)
		.setColor(message.member?.displayColor!)
		.setDescription(
			`С вас было списано \`1000\` ${config.emojis.SHARDS}\nНовый цвет: ${role.toString()}`
		);
	message.channel.send({ content: message.author.toString(), embeds: [embed] });
}

async function nameChange(message: Message, args: string[], dataOptions: dataOptions) {
	const { user, roleData, role } = dataOptions;
	const currentTime = new Date().getTime();
	if (roleData.nameChange && roleData.nameChange > currentTime) {
		return util.errorMessage(message, {
			text: `Вам нужно подождать **\`${timeFormat(
				roleData.nameChange - currentTime
			)}\`** прежде вы сможете снова сменить название`,
			reply: true,
		});
	}

	if (user.shards! < 1000) {
		return util.errorMessage(message, {
			text: `Для смены названия, у вас должно быть минимум \`1000\` ${config.emojis.SHARDS}`,
			reply: true,
		});
	}

	const newName = args.slice(1, args.length).join(" ");

	if (!newName) {
		return util.errorMessage(message, {
			text: "Вы не указали новое название для роли",
			reply: true,
		});
	}

	role.setName(newName);

	await userModel.updateOne(
		{ uid: message.author.id },
		{
			$inc: {
				shards: -1000,
			},
		}
	);

	await activatedRoles.updateOne(
		{ uid: message.author.id },
		{
			nameChange: new Date().getTime() + 1296000000, // 30 days
		}
	);

	const embed = new MessageEmbed()
		.setAuthor(
			message.author.username,
			message.author.displayAvatarURL({ size: 2048, dynamic: true })
		)
		.setColor(message.member?.displayColor!)
		.setDescription(
			`С вас было списано \`1000\` ${
				config.emojis.SHARDS
			}\nНовое название: ${role.toString()}`
		);
	message.channel.send({ content: message.author.toString(), embeds: [embed] });
}

function timeFormat(time: number) {
	const duration = moment.duration(time);

	const hours = duration.hours();
	const days = duration.days();
	const minutes = duration.minutes();
	const sHours = hours < 10 ? `0${hours}` : `${hours}`;
	const sMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
	const sDays = days < 10 ? `0${days}` : `${days}`;

	return sDays + "д " + sHours + "ч " + sMinutes + "м";
}

interface dataOptions {
	role: Role;
	user: IUser;
	roleData: IActivatedRoles;
}

export default cmd;
