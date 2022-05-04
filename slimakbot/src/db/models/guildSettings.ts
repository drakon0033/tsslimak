import { Schema, model } from "mongoose";
import { IGuildSettings } from "../types/guildSettings";

const _guildSettings = new Schema({
    gid: {
        type: String,
        default: null
    },
    noXPchannels: {
        type: String,
        default: null
    },
    muteRole: {
        type: String,
        default: null
    },
    vName: {
        type: String,
        default: '🌕 Moon'
    },
    vLuvName: {
        type: String,
        default: '🏮 Lights'
    },
    vCat: {
        type: String,
        default: null
    },
    vLuvCat: {
        type: String,
        default: null
    },
    vChannelCreate: {
        type: String,
        default: null,
    }
})


export const guildSettings = model<IGuildSettings>('guildSettings', _guildSettings);