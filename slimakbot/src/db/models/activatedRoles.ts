import { Schema, model } from "mongoose";
import { IActivatedRoles } from "../types/activatedRoles";

const _activatedRoles: Schema = new Schema({
	uid: {
		type: String,
		default: null,
	},
	roleID: {
		type: String,
		default: null,
	},
	removeTime: {
		default: null,
		type: Number,
	},
	colorChange: {
		default: null,
		type: Number,
	},
	nameChange: {
		default: null,
		type: Number,
	},
});

export const activatedRoles = model<IActivatedRoles>(
	"activatedRoles",
	_activatedRoles
);
