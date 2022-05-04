import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IUnixesTimes extends Document {
    uid?: Snowflake
    roleID?: Snowflake
    removeTime?: number
}