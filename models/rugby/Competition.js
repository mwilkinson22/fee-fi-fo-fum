const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSchema = new Schema({
	type: { type: String, enum: competitionTypes },
	name: String,
	playerLimit: { type: Number, default: 17 },
	useAllSquads: { type: Boolean, default: "false" },
	webcrawlUrl: { type: String, enum: [null, "SL", "RFL"] }
});

mongoose.model("competitions", competitionSchema);
