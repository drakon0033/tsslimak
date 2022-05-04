import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IReactionRoles extends Document {
	channelID: Snowflake;
	messageID: Snowflake;
	reaction: Snowflake | string;
	roles: Snowflake[];
}
