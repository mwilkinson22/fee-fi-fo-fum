const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamTypeSchema = new Schema({
	name: { type: String, unique: true, required: true },
	slug: { type: String, unique: true, required: true },
	gender: { type: String, enum: ["M", "F"], required: true },
	sortOrder: { type: Number, required: true }
});

mongoose.model("teamTypes", teamTypeSchema);
