import { reactionRolesModel } from "../db/models/reactionRoles";
import { EVENT, util } from "../struct";

const event: EVENT<"messageDelete"> = {
	name: "messageDelete",
	run: async (message, client) => {
		if (message.partial) {
			try {
				await message.fetch();
			} catch (_) {}
		}

		if (!message.id) return;

		if (
			await reactionRolesModel.findOne({
				messageID: message.id,
			})
		) {
			await reactionRolesModel.deleteMany({
				messageID: message.id,
			});
		}
	},
};

export default event;
