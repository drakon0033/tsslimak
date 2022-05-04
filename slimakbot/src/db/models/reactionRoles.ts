import { Schema, model } from "mongoose";
import { IReactionRoles } from "../types/reactionRoles";

const _: Schema = new Schema({
	channelID: String,
	messageID: String,
	reaction: String,
	roles: Array,
});

export const reactionRolesModel = model<IReactionRoles>("reactionRoles", _);
