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
				customStyling: {
					backgroundColor: { type: String, default: null },
					color: { type: String, default: null }
				},
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
				],
				manOfSteelPoints: { type: Boolean, default: false },
				scoreOnly: { type: Boolean, default: true }
			}
		],
		externalCompId: { type: Number, default: null },
		externalDivId: { type: Number, default: null }
	},
	{
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
);

mongoose.model("competitionSegments", competitionSegmentSchema);
