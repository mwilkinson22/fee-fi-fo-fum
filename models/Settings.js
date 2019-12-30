const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingsSchema = new Schema({
	name: { type: String, required: true, unique: true },
	value: { type: Schema.Types.Mixed, required: true },
	requireAdminToView: { type: Boolean, required: true, default: true }
});

mongoose.model("settings", settingsSchema);
