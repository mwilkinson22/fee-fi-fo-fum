const mongoose = require("mongoose");
const { Schema } = mongoose;

const playerStats = new Schema({
	initial: String,
	singular: String,
	plural: String,
	unit: { type: String, default: null },
	storedInDatabase: Boolean
});

mongoose.model("playerStats", playerStats);
