import { Schema, model } from "mongoose";
import { IUser } from "../types/user";

const user = new Schema({
	uid: {
		type: String,
	},
	luv: {
		type: String,
		default: null,
	},
	shards: {
		type: Number,
		default: 0,
	},
	picture: {
		type: String,
		default:
			"https://images-ext-2.discordapp.net/external/3_xPvTqXDlSpYXTcRvHIhKSPbTwqQzy_juMZqxZLM_k/https/media.discordapp.net/attachments/707586279163953212/737953194436460564/giphy_4.gif",
	},
	messages: {
		type: Number,
		default: 0,
	},
	lvl: {
		type: Number,
		default: 0,
	},
	xp: {
		type: Number,
		default: 0,
	},
	status: {
		type: String,
		default: `⠀ ⠀⠀⠀ ⠀⠀ ⠀ ⠀⠀ ⠀Не установлен ⠀⠀ ⠀⠀ ⠀⠀ ⠀⠀⠀⠀`,
	},
	voice: {
		type: Object,
		default: {
			voiceTime: null,
			voiceBonus: 18000000,
			allTime: 0,
		},
	},
	daily: {
		type: String,
		default: null,
	},
	inventory: {
		type: Object,
		default: {
			capsuls: 0,
			particles: 0,
		},
	},
	clanID: {
		type: String,
		default: null,
	},
});

export const userModel = model<IUser>("Users", user);
