const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatsCollectionSchema = require("./PlayerStatsCollection");
const { positionKeys } = require("../../constants/playerPositions");

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
		mainPosition: { type: String, enum: positionKeys },
		otherPositions: [{ type: String, enum: positionKeys }]
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

personSchema.statics.searchByName = async function(str, extraParams = {}, limit = 20) {
	const regex = new RegExp(str, "ig");

	const results = await this.aggregate([
		// Project the concatenated full name along with the original doc
		{ $match: extraParams },
		{ $project: { fullname: { $concat: ["$name.first", " ", "$name.last"] }, doc: "$$ROOT" } },
		{ $match: { fullname: regex } },
		{ $sort: { fullname: 1 } },
		{ $limit: limit }
	]);

	return results;
};

personSchema.statics.generateSlug = async function(firstName, lastName) {
	const coreSlugText = (firstName + " " + lastName)
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

mongoose.model("people", personSchema, "people"); //Third argument added to prevent "peoples"
