import { Guild, VoiceChannel, VoiceState } from "discord.js";
import { guildSettings } from "../db/models/guildSettings";
import { userModel } from "../db/models/userModel";
import { IGuildSettings } from "../db/types/guildSettings";
import { config, EVENT, maps, util } from "../struct";

const event: EVENT<"voiceStateUpdate"> = {
	name: "voiceStateUpdate",
	run: async (oldState, newState, client) => {
		const member = oldState.member || newState.member;
		const guild = member?.guild;

		const bitrate = getBitrate(guild!);
		const gSetts = await guildSettings.findOne({ gid: guild?.id });

		addRemoveVoiceRole(oldState, newState);

		const luvCreated = await createLuvChannel(
			oldState,
			newState,
			gSetts!,
			bitrate
		);
		if (luvCreated) {
			return;
		}

		createPrivateChannel(oldState, newState, gSetts!, bitrate);
	},
};

function getBitrate(guild: Guild) {
	switch (guild.premiumTier) {
		case "TIER_1":
			return 128000;
		case "TIER_2":
			return 256000;
		case "TIER_3":
			return 384000;
		default:
			return 96000;
	}
}

function addRemoveVoiceRole(oldState: VoiceState, newState: VoiceState) {
	if (newState.member && newState.channel) {
		newState.member.roles.add(config.ids.roleIds.memberinVoiceRole);
	} else if (oldState.member && oldState.channel) {
		oldState.member.roles.remove(config.ids.roleIds.memberinVoiceRole);
	}
}

async function createLuvChannel(
	oldState: VoiceState,
	newState: VoiceState,
	gSettings: IGuildSettings,
	bitrate: number
) {
	const { member, channel } = newState;
	if (
		member &&
		channel &&
		channel.userLimit === 2 &&
		maps.automaton.has(channel.id!) &&
		channel.parentId != gSettings.vLuvCat
	) {
		const userData = await userModel.findOne({ uid: member.id });

		if (!userData?.luv) {
			return;
		}

		const secondMember = channel.members.get(userData.luv);
		if (!secondMember) {
			return;
		}

		let newChannel: VoiceChannel;
		try {
			newChannel = await member.guild.channels.create(
				gSettings.vLuvName!,
				{
					bitrate,
					userLimit: 2,
					type: "GUILD_VOICE",
					parent: gSettings.vLuvCat,
					permissionOverwrites: [
						{
							id: member.id,
							allow: ["CONNECT"],
						},
						{
							id: secondMember.id,
							allow: ["CONNECT"],
						},
						{
							id: member.guild.id,
							deny: ["CONNECT", "VIEW_CHANNEL"],
						},
						{
							id: config.ids.roleIds.UserDefault,
							allow: ["VIEW_CHANNEL"],
						},
					],
				}
			);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				eventName: event.name,
				isEvent: true,
				guild: member.guild,
			});
			return;
		}

		try {
			await member.voice.setChannel(newChannel);
			await secondMember.voice.setChannel(newChannel);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				eventName: event.name,
				isEvent: true,
				guild: member.guild,
			});
			return;
		}

		maps.automaton.set(newChannel.id, {
			memberID: member.id,
			chID: newChannel.id,
		});

		setTimeout(() => {
			if (newChannel.deleted) {
				return maps.automaton.delete(newChannel.id);
			}
			if (!newChannel.members.size) {
				newChannel.delete();
				return maps.automaton.delete(newChannel.id);
			}
		}, 10000);

		return true;
	}
}

async function createPrivateChannel(
	oldState: VoiceState,
	newState: VoiceState,
	gSettings: IGuildSettings,
	bitrate: number
) {
	if (
		newState.member &&
		newState.channel &&
		newState.channel.id === gSettings.vChannelCreate
	) {
		const { member } = newState;
		const alreadyHasVoice = maps.automaton.find(
			entry => entry.memberID === member?.id
		);

		if (alreadyHasVoice) {
			await member?.voice.setChannel(alreadyHasVoice.chID);
			return true;
		}

		let newChannel: VoiceChannel;
		try {
			newChannel = await member?.guild.channels.create(gSettings.vName!, {
				bitrate,
				userLimit: 2,
				type: "GUILD_VOICE",
				parent: gSettings.vCat,
				permissionOverwrites: [
					{
						id: member.id,
						allow: ["CONNECT", "SPEAK", "CREATE_INSTANT_INVITE"],
					},
					{
						id: member.guild.id,
						deny: ["CREATE_INSTANT_INVITE", "VIEW_CHANNEL"],
					},
					{
						id: config.ids.roleIds.UserDefault,
						allow: ["VIEW_CHANNEL"],
					},
				],
			})!;
		} catch (error) {
			util.DiscordErrorHandler(error, {
				eventName: event.name,
				guild: member?.guild,
				isEvent: true,
			});
			return;
		}

		try {
			await member?.voice.setChannel(newChannel.id);
		} catch (error) {
			util.DiscordErrorHandler(error, {
				eventName: event.name,
				guild: member?.guild,
				isEvent: true,
			});
			return;
		}

		maps.automaton.set(newChannel.id, {
			memberID: member?.id!,
			chID: newChannel.id,
		});

		setTimeout(() => {
			if (newChannel.deleted) {
				return maps.automaton.delete(newChannel.id);
			}
			if (!newChannel.members.size) {
				newChannel.delete();
				return maps.automaton.delete(newChannel.id);
			}
		}, 10000);

		return true;
	} else if (
		oldState.member &&
		oldState.channel &&
		oldState.channel.members.size === 0 &&
		maps.automaton.has(oldState.channelId!)
	) {
		maps.automaton.delete(oldState.channelId!);
		oldState.channel.delete();
	}
}

export default event;
