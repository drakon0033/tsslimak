import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IColorShop extends Document {
    roleID?: Snowflake
    rolePrice?: number
    roleTime?: number
    rolePosition?: number
}