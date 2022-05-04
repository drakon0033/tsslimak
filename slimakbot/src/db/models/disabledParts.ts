import { Schema, model } from "mongoose";
import { IDisableParts } from "../types/disabledParts";

const _disableParts: Schema = new Schema({
    name: {
        type: String,
        default: null
    },
    channel: {
        type: String,
        default: null
    }
})

export const disableParts = model<IDisableParts>('disableParts', _disableParts);