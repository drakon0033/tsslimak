import { Schema, model } from "mongoose"
import { INotify } from "../types/notify"

const notify: Schema = new Schema({
    uid: {
        type: String
    }
})

export const notifyModel = model<INotify>("Notify", notify)