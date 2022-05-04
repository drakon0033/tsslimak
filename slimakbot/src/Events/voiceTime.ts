import { TextChannel } from "discord.js";
import { userModel } from "../db/models/userModel";
import { config, EVENT, util } from "../struct";

const event: EVENT<"voiceStateUpdate"> = {
	name: "voiceStateUpdate",
	run: async (oldState, newState, Client) => {
		if (oldState.member?.user.bot || newState.member?.user.bot) {
			return;
		}

		const member = oldState.member || newState.member;
		const guild = oldState.guild || newState.guild;

		if (newState.member && newState.channel && !oldState.channel) {
			await userModel.updateOne(
				{ uid: member?.id },
				{
					$set: {
						"voice.voiceTime": new Date().getTime(),
					},
				}
			);
		} else if (oldState.member && oldState.channel && !newState.channel) {
			const channel = guild.channels.cache.get(
				config.ids.channelIds.SkyNet
			) as TextChannel;
			util.updateVoiceTime(member!, {
				isEvent: true,
			});
		}
	},
};

export default event;
