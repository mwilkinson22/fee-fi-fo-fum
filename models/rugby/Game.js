const mongoose = require("mongoose");
const { Schema } = mongoose;
const PlayerStatsCollectionSchema = require("./PlayerStatsCollection");

const gameSchema = new Schema({
	_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments" },
	_opposition: { type: Schema.Types.ObjectId, ref: "teams" },
	isAway: Boolean,
	date: Date,
	pregameSquads: {
		home: [{ type: Schema.Types.ObjectId, ref: "people" }],
		away: [{ type: Schema.Types.ObjectId, ref: "people" }]
	},
	playerStats: [
		{
			_player: { type: Schema.Types.ObjectId, ref: "people" },
			_team: { type: Schema.Types.ObjectId, ref: "teams" },
			position: Number,
			stats: PlayerStatsCollectionSchema
		}
	],
	_ground: { type: Schema.Types.ObjectId, ref: "grounds", default: null },
	Title: String,
	Hashtags: [String],
	_motm: { type: Schema.Types.ObjectId, ref: "people" },
	_fan_motm: { type: Schema.Types.ObjectId, ref: "people" },
	fan_motm_link: String,
	_referee: { type: Schema.Types.ObjectId, ref: "people" },
	_video_referee: { type: Schema.Types.ObjectId, ref: "people" },
	attendance: Number,
	tv: { type: String, enum: [false, "bbc", "sky"], default: false },
	rflFixtureId: Number,
	slug: { type: String, unique: true }
});

gameSchema.statics.generateSlug = async function(opposition, date) {
	const Team = mongoose.models("teams");
	const team = await Team.findById(opposition);
	const coreSlugText = (team.name.short + " " + date)
		.replace(/\s/g, "-")
		.replace(/[^A-Za-z-]/gi, "")
		.toLowerCase();

	let slugExists = await this.findOne({
		slug: coreSlugText
	});

	if (!slugExists) {
		return coreSlugText;
	} else {
		let i = 2;
		let slug;
		while (slugExists) {
			slug = coreSlugText + "-" + i++;
			slugExists = await this.findOne({
				slug
			});
		}

		return slug;
	}
};
mongoose.model("games", gameSchema);
