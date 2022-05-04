import { Snowflake } from "discord.js";
import { Document } from "mongoose";

export interface IUser extends Document {
    uid?: Snowflake
    luv?: Snowflake | null 
    shards?: number
    messages?: number
    lvl?: number
    picture?: string
    xp?: number
    status?: string
    voice?: {
        voiceTime: number | null
        voiceBonus: number
        allTime: number
    }
    daily?: string
    inventory?: {
        capsuls: number
        particles: number
    }
    clanID?: string | null
}