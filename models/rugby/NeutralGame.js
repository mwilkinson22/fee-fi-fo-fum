const mongoose = require("mongoose");
const { Schema } = mongoose;

const neutralGameSchema = new Schema({
	_competition: { type: Schema.Types.ObjectId, ref: "competition.segments" },
	date: Date,
	_homeTeam: { type: Schema.Types.ObjectId, ref: "teams" },
	_awayTeam: { type: Schema.Types.ObjectId, ref: "teams" },
	homePoints: { type: Number, default: null },
	awayPoints: { type: Number, default: null },
	neutralGround: { type: Boolean, default: false },
	rflFixtureId: Number
});

mongoose.model("neutralGame", neutralGameSchema);
