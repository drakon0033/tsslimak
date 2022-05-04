import { Schema, model } from "mongoose"
import { IReminders } from "../types/reminders"

const _reminders: Schema = new Schema({
    counter: {
        type: String
    },
    uid: {
        type: String,
        default: null
    },
    remindTime: {
        type: Number,
        default: null
    },
    text: {
        type: String,
        default: null
    }
})


export const Reminders = model<IReminders>('Reminders', _reminders)