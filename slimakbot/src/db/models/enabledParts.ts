import { Schema, model } from "mongoose";
import { IEnableParts } from "../types/enabledParts";

const _enableParts: Schema = new Schema({
    name: {
        type: String,
        default: null
    },
    channel: {
        type: String,
        default: null
    }
})

export const enableParts = model<IEnableParts>('enableParts', _enableParts);