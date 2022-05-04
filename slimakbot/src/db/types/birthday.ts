import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IBirthday extends Document {
	uid?: Snowflake;
	bdayDate?: string;
}
