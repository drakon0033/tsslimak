import { Schema, model } from "mongoose";
import { IColorShop } from "../types/colorShop";

const _colorShop: Schema = new Schema({
	roleID: {
		type: String,
		default: null,
	},
	rolePrice: {
		default: null,
		type: Number,
	},
	roleTime: {
		default: null,
		type: Number,
	},
	rolePosition: {
		type: Number,
	},
});

export const colorShop = model<IColorShop>("colorShop", _colorShop);
