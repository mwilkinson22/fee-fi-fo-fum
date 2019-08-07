const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatsCollectionSchema = require("./PlayerStatsCollection");
const playerPositions = require("../../constants/playerPositions");
const positionEnums = [null, ...Object.keys(playerPositions)];

const personSchema = new Schema(
	{
		name: {
			first: { type: String, required: true },
			last: { type: String, required: true }
		},
		nickname: { type: String, default: null },
		displayNicknameInCanvases: { type: Boolean, default: false },
		squadNameWhenDuplicate: { type: String, default: null },
		dateOfBirth: { type: Date, default: null },
		gender: { required: true, type: String, enum: ["M", "F"] },
		_hometown: { type: Schema.Types.ObjectId, ref: "cities" },
		_represents: { type: Schema.Types.ObjectId, ref: "countries", default: null },
		twitter: { type: String, default: null },
		instagram: { type: String, default: null },
		rflSiteName: { type: String, default: null },
		externalName: { type: String, default: null },
		rflSiteId: { type: Number, default: null },
		isPlayer: { type: Boolean, default: false },
		isCoach: { type: Boolean, default: false },
		isReferee: { type: Boolean, default: false },
		playerDetails: {
			contractEnds: { type: Number, default: null },
			mainPosition: { type: String, enum: positionEnums },
			otherPositions: [{ type: String, enum: positionEnums }]
		},
		coachDetails: [
			{
				_team: { type: Schema.Types.ObjectId, ref: "teams", required: true },
				role: { type: String, enum: ["head", "interim", "assistant"], required: true },
				from: { type: Date, required: true },
				to: { type: Date, default: null }
			}
		],
		refereeDetails: [
			{
				from: { type: Date, required: true },
				to: { type: Date, default: null }
			}
		],
		additionalPlayerStats: [
			{
				_team: { type: Schema.Types.ObjectId, ref: "teams" },
				year: { type: Number, required: true },
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

		slug: { type: String, unique: true, required: true },
		image: { type: String, default: null },
		description: { type: String, default: null },
		_sponsor: { type: Schema.Types.ObjectId, ref: "sponsors", default: null }
	},
	{
		toJSON: {
			virtuals: true
		},
		toObject: {
			virtuals: true
		}
	}
);

personSchema.statics.searchByName = async function(
	str,
	exact = false,
	extraParams = {},
	limit = 20
) {
	const match = { $match: { fullname: exact ? str : new RegExp(str, "ig") } };

	const results = await this.aggregate([
		// Project the concatenated full name along with the original doc
		{ $match: extraParams },
		{ $project: { fullname: { $concat: ["$name.first", " ", "$name.last"] } } },
		match,
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

personSchema.virtual("name.full").get(function() {
	return this.name.first + " " + this.name.last;
});

mongoose.model("people", personSchema, "people"); //Third argument added to prevent "peoples"
