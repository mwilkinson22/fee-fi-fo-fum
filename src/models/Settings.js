const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingsSchema = new Schema({
	name: { type: String, required: true, unique: true },
	value: { type: Schema.Types.Mixed, required: true },
	requireAdminToView: { type: Boolean, required: true, default: true }
});

mongooseDebug(settingsSchema);

mongoose.model("settings", settingsSchema);
