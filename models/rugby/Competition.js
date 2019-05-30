const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSchema = new Schema({
	type: { type: String, enum: competitionTypes },
	name: String,
	playerLimit: { type: Number, default: 17 },
	useAllSquads: { type: Boolean, default: "false" },
	webcrawlFormat: { type: String, enum: [null, "SL", "RFL"] },
	webcrawlUrl: { type: String, default: null }
});

mongoose.model("competitions", competitionSchema);
