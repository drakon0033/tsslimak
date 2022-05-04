import { Document } from "mongoose";

export interface IReactions extends Document {
    Name?: string
    Gifs?: string[]
    Text?: string
    SoloText?: string
}