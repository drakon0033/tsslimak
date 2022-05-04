import { MessageReaction, PartialMessageReaction, User } from "discord.js";
import { reactionRolesModel } from "../db/models/reactionRoles";
import { config, EVENT, util } from "../struct";

const event: EVENT<"messageReactionAdd"> = {
	name: "messageReactionAdd",
	run: async (reaction, user, client) => {
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (_) {}
		}

		if (reaction.message.partial) {
			try {
				await reaction.message.fetch();
			} catch (_) {}
		}

		if (user.partial) {
			try {
				await user.fetch();
			} catch (_) {}
		}

		if (user.bot) return;

		handleReactionRoles(reaction, user as User);
	},
};

async function handleReactionRoles(
	reaction: MessageReaction | PartialMessageReaction,
	user: User
) {
	const { message, emoji } = reaction;
	const { channel } = message;

	const reactionRole = await reactionRolesModel.findOne({
		channelID: channel.id,
		messageID: message.id,
		reaction: emoji.id ? emoji.toString() : emoji.name!,
	});

	if (!reactionRole) return;

	try {
		const member = await message.guild?.members.fetch(user.id);
		if (reactionRole.roles.includes(config.ids.roleIds.UserDefault)) {
			const channel = util.getTextChannel(
				config.ids.channelIds.GeneralChat,
				message.guild!
			);
			channel.send(
				`Встречайте новичка ${user.username} (${user.id}) <a:Shine:777550535364444241>`
			);
		}
		member?.roles.add(reactionRole.roles);
	} catch (_) {}
}

export default event;
