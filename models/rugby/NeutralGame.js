const mongoose = require("mongoose");
const { Schema } = mongoose;

const neutralGameSchema = new Schema({
	_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments" },
	date: { type: Date, required: true },
	_homeTeam: { type: Schema.Types.ObjectId, ref: "teams", required: true },
	_awayTeam: { type: Schema.Types.ObjectId, ref: "teams", required: true },
	homePoints: { type: Number, default: null },
	awayPoints: { type: Number, default: null },
	_teamType: { type: Schema.Types.ObjectId, ref: "teamTypes" },
	externalId: { type: Number, default: null },
	externalSite: { type: String, enum: ["RFL", "SL", null], default: null },
	externalSync: { type: Boolean, default: false }
});

mongoose.model("neutralGames", neutralGameSchema);
