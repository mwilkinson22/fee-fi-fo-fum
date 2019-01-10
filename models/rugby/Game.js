const mongoose = require("mongoose");
const { Schema } = mongoose;
const PlayerStatsCollectionSchema = require("./PlayerStatsCollection");

const gameSchema = new Schema(
	{
		_competition: { type: Schema.Types.ObjectId, ref: "competitionSegments", required: true },
		_opposition: { type: Schema.Types.ObjectId, ref: "teams", required: true },
		isAway: { type: Boolean, required: true },
		date: { type: Date, required: true },
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
		round: { type: Number, default: null },
		_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
		title: { type: String, default: null },
		hashtags: [String],
		_motm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		_fan_motm: { type: Schema.Types.ObjectId, ref: "people", default: null },
		fan_motm_link: { type: String, default: null },
		_referee: { type: Schema.Types.ObjectId, ref: "people", default: null },
		_video_referee: { type: Schema.Types.ObjectId, ref: "people", default: null },
		attendance: { type: Number, default: null },
		tv: { type: String, enum: [false, "bbc", "sky"], default: null },
		rflFixtureId: { type: Number, default: null },
		slug: { type: String, unique: true, required: true },
		_teamType: {
			type: Schema.Types.ObjectId,
			ref: "teamTypes",
			required: true
		}
	},
	{
		toObject: {
			virtuals: true
		},
		toJSON: {
			virtuals: true
		}
	}
);

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

gameSchema.query.getFixtures = function(fixtures) {
	const now = new Date();
	if (fixtures) {
		return this.where({ date: { $gt: now } });
	} else {
		return this.where({ date: { $lte: now } });
	}
};
mongoose.model("games", gameSchema);
