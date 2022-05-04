import { Schema, model } from "mongoose"
import { IBirthday } from "../types/birthday"

const birthday: Schema = new Schema({
    uid: {
        type: String
    },
    bdayDate: {
        type: String
    }
})

export const birthdayModel = model<IBirthday>("birthday", birthday)