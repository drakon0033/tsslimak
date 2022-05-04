import { GuildChannel } from "discord.js";
import { guildSettings } from "../db/models/guildSettings";
import { EVENT } from "../struct";

const event: EVENT<"channelCreate"> = {
	name: "channelCreate",
	run: async (channel, client) => {
		const ch = ["GUILD_TEXT", "GUILD_VOICE"].includes(channel.type)
			? (channel as GuildChannel)
			: undefined;
		if (!ch) {
			return;
		}
		const gSetts = await guildSettings.findOne({ gid: ch.guild.id });
		const role = gSetts?.muteRole ? gSetts.muteRole : undefined;

		if (!role) {
			return;
		}

		switch (ch.type) {
			case "GUILD_TEXT":
				ch.permissionOverwrites.edit(role, {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false,
				});
				break;
			case "GUILD_VOICE":
				const array = [gSetts?.vLuvCat, gSetts?.vCat];
				if (array.includes(ch.parentId!)) {
					return;
				}
				ch.permissionOverwrites.edit(role, {
					SPEAK: false,
				});
				break;
		}
	},
};

export default event;
