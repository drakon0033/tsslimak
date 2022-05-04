import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IGuildSettings extends Document {
	gid?: Snowflake;
	noXPchannels?: Snowflake;
	muteRole?: Snowflake;
	vName?: string;
	vLuvName?: string;
	vCat?: Snowflake;
	vLuvCat?: Snowflake;
	vChannelCreate?: Snowflake;
}
