import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IActivatedRoles extends Document {
	uid?: Snowflake;
	roleID?: Snowflake;
	removeTime?: number;
	colorChange?: number;
	nameChange?: number;
}
