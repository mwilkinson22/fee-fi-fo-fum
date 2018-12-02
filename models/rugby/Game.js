const mongoose = require("mongoose");
const { Schema } = mongoose;

const gameSchema = new Schema({
	_competition: { type: Schema.Types.ObjectId, ref: "competition.segments" },
	_opposition: { type: Schema.Types.ObjectId, ref: "teams" },
	isAway: Boolean,
	date: Date,
	pregameSquads: {
		home: [{ type: Schema.Types.ObjectId, ref: "people" }],
		away: [{ type: Schema.Types.ObjectId, ref: "people" }]
	},
	_ground: { type: Schema.Types.ObjectId, ref: "grounds", default: null },
	Title: String,
	Hashtags: [String],
	_motm: { type: Schema.Types.ObjectId, ref: "people" },
	_fan_motm: { type: Schema.Types.ObjectId, ref: "people" },
	fan_motm_link: String,
	_referee: { type: Schema.Types.ObjectId, ref: "people" },
	_video_referee: { type: Schema.Types.ObjectId, ref: "people" },
	attendance: Number,
	tv: {
		sky: Boolean,
		bbc: Boolean
	},
	rflFixtureId: Number,
	slug: { type: String, unique: true }
});

mongoose.model("game", gameSchema);
