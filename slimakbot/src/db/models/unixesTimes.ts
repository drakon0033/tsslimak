import { Schema, model } from "mongoose"
import { IUnixesTimes } from "../types/unixesTimes"

const _unixesTimes: Schema = new Schema({
    uid: {
        type: String,
        default: null
    },
    roleID: {
        type: String,
        default: null
    },
    removeTime: {
        type: Number,
        default: null
    }
})

export const UnixesTimes = model<IUnixesTimes>('UnixesTimes', _unixesTimes)