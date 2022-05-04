import { User, MessageReaction, PartialMessageReaction } from "discord.js";
import { reactionRolesModel } from "../db/models/reactionRoles";
import { EVENT, util } from "../struct";

const event: EVENT<"messageReactionRemove"> = {
	name: "messageReactionRemove",
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
		member?.roles.remove(reactionRole.roles);
	} catch (_) {}
}

export default event;
