import { Schema, model } from "mongoose";
import { IGiveaway } from "../types/giveaway";

const _giveaway: Schema = new Schema({
	gid: {
		type: String,
	},
	winners: {
		type: String,
	},
	prize: {
		type: String,
	},
	endUnix: {
		type: Number,
	},
	channelID: {
		type: String,
	},
	messageID: {
		type: String,
	},
});

export const Giveaway = model<IGiveaway>("Giveaway", _giveaway);
