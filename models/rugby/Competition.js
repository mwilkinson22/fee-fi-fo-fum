const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSchema = new Schema({
	type: { type: String, enum: competitionTypes },
	name: String,
	playerLimit: { type: Boolean, default: "true" },
	useAllSquads: { type: Boolean, default: "false" }
});

mongoose.model("competitions", competitionSchema);
