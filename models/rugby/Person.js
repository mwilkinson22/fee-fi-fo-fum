const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatsCollectionSchema = require("./PlayerStatsCollection");
const playerPositions = require("../../constants/playerPositions");
const positionEnums = [null, ...Object.keys(playerPositions)];

const personSchema = new Schema(
	{
		//Generic
		name: {
			first: { type: String, required: true },
			last: { type: String, required: true }
		},
		dateOfBirth: { type: Date, default: null },
		nickname: { type: String, default: null },
		gender: { required: true, type: String, enum: ["M", "F"] },
		_hometown: { type: Schema.Types.ObjectId, ref: "cities" },
		_represents: { type: Schema.Types.ObjectId, ref: "countries", default: null },
		twitter: { type: String, default: null },
		instagram: { type: String, default: null },
		slug: { type: String, unique: true, required: true },
		image: { type: String, default: null },
		description: [{ type: String, default: null }],
		_sponsor: { type: Schema.Types.ObjectId, ref: "sponsors", default: null },

		//Players
		isPlayer: { type: Boolean, default: false },
		displayNicknameInCanvases: { type: Boolean, default: false },
		squadNameWhenDuplicate: { type: String, default: null },
		externalName: { type: String, default: null },
		contractedUntil: { type: Number, default: null },
		playingPositions: [{ type: String, default: null, enum: positionEnums }],
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

		//Coaches
		isCoach: { type: Boolean, default: false },
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

		//Refs
		isReferee: { type: Boolean, default: false },
		refereeDetails: {
			from: { type: Date, default: null },
			to: { type: Date, default: null }
		}
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
