const mongoose = require("mongoose");
const { Schema } = mongoose;

const neutralGameSchema = new Schema({
	_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments" },
	date: Date,
	_homeTeam: { type: Schema.Types.ObjectId, ref: "teams" },
	_awayTeam: { type: Schema.Types.ObjectId, ref: "teams" },
	homePoints: { type: Number, default: null },
	awayPoints: { type: Number, default: null },
	neutralGround: { type: Boolean, default: false },
	_teamType: { type: Schema.Types.ObjectId, ref: "teamTypes" },
	externalId: Number,
	externalSite: { type: String, enum: ["RFL", "SL", null] }
});

mongoose.model("neutralGames", neutralGameSchema);
