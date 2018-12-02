const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatsCollectionSchema = require("./PlayerStatsCollection");

const personSchema = new Schema({
	name: {
		first: String,
		last: String
	},
	nickname: { type: String, default: null },
	dateOfBirth: Date,
	_hometown: { type: Schema.Types.ObjectId, ref: "cities" },
	_represents: { type: Schema.Types.ObjectId, ref: "country", default: null },
	twitter: String,
	instagram: String,
	rflSiteName: String,
	rflSiteId: Number,
	isPlayer: Boolean,
	isCoach: Boolean,
	isReferee: Boolean,
	playerDetails: {
		contractEnds: Number,
		positions: {
			type: [{ type: Schema.Types.ObjectId, ref: "positions" }],
			required: true
		}
	},
	coachDetails: [
		{
			_team: { type: Schema.Types.ObjectId, ref: "teams" },
			role: { type: String, enum: ["head", "interim", "assistant"] },
			from: Date,
			to: { type: Date, default: null }
		}
	],
	refereeDetails: [
		{
			from: Date,
			to: { type: Date, default: null }
		}
	],
	additionalPlayerStats: [
		{
			_team: { type: Schema.Types.ObjectId, ref: "teams" },
			year: Number,
			stats: [
				{
					competition: {
						type: Schema.Types.ObjectId,
						ref: "competitions.segments"
					},
					stats: playerStatsCollectionSchema
				}
			]
		}
	],
	additionalCoachStats: [
		{
			_team: { type: Schema.Types.ObjectId, ref: "teams" },
			from: Date,
			to: { type: Date, default: null },
			w: Number,
			l: Number,
			d: Number
		}
	],
	slug: { type: String, unique: true }
});

mongoose.model("people", personSchema);
