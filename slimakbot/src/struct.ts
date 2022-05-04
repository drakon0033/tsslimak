// import strftime from "strftime"
import {
	Client,
	Message,
	ClientEvents,
	Collection,
	MessageEmbed,
	GuildMember,
	TextChannel,
	Snowflake,
} from "discord.js";
import configjson from "./config.json";
// import configjson from "./configTest.json";
import utils from "./util";
import errorCodesJson from "./errorCodes.json";
import { Random } from "random-js";

type category =
	| "Dev"
	| "Economy"
	| "General"
	| "Guild Settings"
	| "Mod 1"
	| "Mod 2"
	| "Reactions"
	| "Shop"
	| "Voice";

type permissions = "Dev" | "Admin" | "Moderator" | "User";
type automaton = {
	memberID: Snowflake;
	chID: Snowflake;
};

export type duelOptions = {
	times: number;
	msgToEdit?: Message;
	embedToEdit?: MessageEmbed;
	firstUserCount: number;
	secondUserCount: number;
	firstUser: GuildMember;
	secondUser: GuildMember;
	amount: number;
};
const events: Array<EVENT<keyof ClientEvents>> = [];

export const randomEngine = new Random();
export const util = utils;
export const config = configjson as ICONFIG;
export const errorCodes = errorCodesJson;
export const maps = {
	userInDuel: new Collection<Snowflake, unknown>(),
	userInBet: new Collection<Snowflake, unknown>(),
	userInTask: new Collection<Snowflake, unknown>(),
	userInXPCD: new Collection<Snowflake, unknown>(),
	cooldowns: new Collection<Snowflake, number>(),
	automaton: new Collection<Snowflake, automaton>(),
	commands: new Collection<string, COMMAND>(),
	events,
};

export interface COMMAND {
	name: string;
	category: category;
	permission: permissions;
	cooldown: number;
	helpInfo: string;
	example: string[];
	aliases?: string[];
	advancedInfo?: string;
	run(client: Client, msg: Message, args: string[]): Promise<unknown>;
}

export interface EVENT<T extends keyof ClientEvents> {
	name: T;
	run(...args: [...ClientEvents[T], Client]): Promise<unknown>;
}

export interface GuildSettings {
	PREFIX: string;
	VoiceCof: number;
	guildID: Snowflake;
}

export interface Settings {
	TOKEN: string;
	MONGOURI: string;
}

export interface Colors {
	embedBlankColor: string;
}

export interface UserIds {
	sUpBotID: Snowflake;
	bumpBotId: Snowflake;
	OWNER_ID: Snowflake;
}

interface RoleIds {
	AdminRoles: Snowflake[];
	ModeratorRoles: Snowflake[];
	UserDefault: Snowflake;
	luvRole: Snowflake;
	lvl3: Snowflake;
	lvl5: Snowflake;
	lvl10: Snowflake;
	lvl15: Snowflake;
	lvl30: Snowflake;
	lvl50: Snowflake;
	NitroBooster: Snowflake;
	femaleRole: Snowflake;
	maleRole: Snowflake;
	memberinVoiceRole: Snowflake;
	birthdayRole: Snowflake;
}

interface ChannelIds {
	announceChannel: Snowflake;
	AfkRoom: Snowflake;
	SkyNet: Snowflake;
	GeneralChat: Snowflake;
	ErrorChannel: Snowflake;
	ReactionsRequest: Snowflake;
}

interface Ids {
	userIds: UserIds;
	roleIds: RoleIds;
	channelIds: ChannelIds;
}

interface Emojis {
	ListEmoji: string;
	InfoEmoji: string;
	LEFTEmoji: string;
	RIGHTEmoji: string;
	CROSS: string;
	CHECK: string;
	MICRO: string;
	MESSAGES: string;
	XP: string;
	LVL: string;
	SHARDS: string;
	CAPS: string;
	PART: string;
	CLAN: string;
}

interface ICONFIG {
	guildSettings: GuildSettings;
	settings: Settings;
	colors: Colors;
	ids: Ids;
	emojis: Emojis;
}
