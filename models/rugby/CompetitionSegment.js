const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSegmentSchema = new Schema(
	{
		_parentCompetition: {
			type: Schema.Types.ObjectId,
			ref: "competitions"
		},
		type: { type: String, enum: competitionTypes },
		name: String,
		_teamType: {
			type: Schema.Types.ObjectId,
			ref: "teamTypes"
		},
		appendCompetitionName: Boolean,
		hashtagPrefix: String,
		_pointsCarriedFrom: {
			type: Schema.Types.ObjectId,
			ref: "competitionSegments"
		},
		instances: [
			{
				year: Number,
				sponsor: String,
				image: String,
				specialRounds: [
					{
						round: Number,
						name: String,
						hashtag: [String],
						overwriteBaseHashtag: {
							type: Boolean,
							default: false
						}
					}
				],
				teams: [{ type: Schema.Types.ObjectId, ref: "teams" }],
				leagueTableColours: [
					{
						className: String,
						position: [Number]
					}
				],
				adjustments: [
					{
						_team: { type: Schema.Types.ObjectId, ref: "teams" },
						adjustment: Number
					}
				]
			}
		]
	},
	{
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
);

mongoose.model("competitionSegments", competitionSegmentSchema);
