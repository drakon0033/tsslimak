import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IReminders extends Document {
    counter?: string
    uid?: Snowflake
    remindTime?: number
    text?: string
}