import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IGiveaway extends Document {
	gid?: Snowflake;
	winners?: Snowflake[];
	prize?: string;
	endUnix?: number;
	channelID?: Snowflake;
	messageID?: Snowflake;
}
