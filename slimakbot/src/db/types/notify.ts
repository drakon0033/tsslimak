import { Snowflake } from "discord.js";
import { Document } from "mongoose"

export interface INotify extends Document {
    uid: Snowflake
}