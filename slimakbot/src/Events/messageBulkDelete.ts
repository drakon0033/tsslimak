import { reactionRolesModel } from "../db/models/reactionRoles";
import { EVENT, util } from "../struct";

const event: EVENT<"messageDeleteBulk"> = {
	name: "messageDeleteBulk",
	run: async (messages, client) => {
		for (const message of messages.keys()) {
			if (
				await reactionRolesModel.findOne({
					messageID: message,
				})
			) {
				await reactionRolesModel.deleteMany({
					messageID: message,
				});
			}
		}
	},
};

export default event;
