const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamTypeSchema = new Schema({
	name: { type: String, unique: true },
	slug: { type: String, unique: true },
	sortOrder: Number
});

mongoose.model("teamTypes", teamTypeSchema);
