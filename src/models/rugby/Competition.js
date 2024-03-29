const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSchema = new Schema({
	type: { type: String, enum: competitionTypes },
	name: String,
	interchangeLimit: { type: Number, default: 4 },
	useAllSquads: { type: Boolean, default: "false" },
	webcrawlFormat: { type: String, enum: [null, "SL", "RFL"] }
});

mongooseDebug(competitionSchema);
mongoose.model("competitions", competitionSchema);
