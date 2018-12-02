const mongoose = require("mongoose");
const { Schema } = mongoose;

const playerStats = new Schema({
	initial: String,
	singular: String,
	plural: String,
	unit: { type: String, default: null },
	storedInDatabase: Boolean,
	moreIsBetter: { type: Boolean, default: true }
});

mongoose.model("playerStats", playerStats);
