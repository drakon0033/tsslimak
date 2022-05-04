import { Schema, model } from "mongoose";
import { IReactions } from "../types/reactions";

const reactions: Schema = new Schema({
	Name: String,
	Gifs: Array,
	Text: String,
	SoloText: String,
});

export const Reactions = model<IReactions>("Reactions", reactions);
