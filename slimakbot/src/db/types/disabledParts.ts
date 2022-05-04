import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IDisableParts extends Document {
    name?: string
    channel?: Snowflake | undefined | null
}