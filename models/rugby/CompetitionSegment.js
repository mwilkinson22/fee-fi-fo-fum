const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSegmentSchema = new Schema(
	{
		_parentCompetition: { type: Schema.Types.ObjectId, ref: "competitions", required: true },
		type: { type: String, enum: competitionTypes, required: true },
		name: { type: String, required: true },
		_teamType: { type: Schema.Types.ObjectId, ref: "teamTypes", required: true },
		appendCompetitionName: { type: Boolean, default: false },
		hashtagPrefix: { type: String, required: true },
		_pointsCarriedFrom: {
			type: Schema.Types.ObjectId,
			ref: "competitionSegments",
			default: null
		},
		multipleInstances: { type: Boolean, required: true },
		instances: [
			{
				year: { type: Number, default: null },
				sponsor: { type: String, default: null },
				image: { type: String, default: null },
				specialRounds: [
					{
						round: { type: Number, required: true },
						name: { type: String, required: true },
						hashtag: [{ type: String }],
						overwriteBaseHashtag: {
							type: Boolean,
							default: false
						}
					}
				],
				teams: [{ type: Schema.Types.ObjectId, ref: "teams" }],
				customStyling: {
					backgroundColor: { type: String, default: "#111111" },
					color: { type: String, default: "#FFFFFF" }
				},
				leagueTableColours: [
					{
						className: String,
						position: [Number]
					}
				],
				adjustments: [
					{
						_team: { type: Schema.Types.ObjectId, ref: "teams", required: true },
						W: { type: Number, default: 0, required: true },
						D: { type: Number, default: 0, required: true },
						L: { type: Number, default: 0, required: true },
						Pts: { type: Number, default: 0, required: true },
						F: { type: Number, default: 0, required: true },
						A: { type: Number, default: 0, required: true }
					}
				],
				usesPregameSquads: { type: Boolean, default: true },
				manOfSteelPoints: { type: Boolean, default: false },
				scoreOnly: { type: Boolean, default: true },
				sharedSquads: [
					{
						_team: { type: Schema.Types.ObjectId, ref: "teams", required: true },
						sharedWith: [{ type: Schema.Types.ObjectId, ref: "teams", required: true }]
					}
				]
			}
		],
		externalCompId: { type: Number, default: null },
		externalDivId: { type: Number, default: null },
		externalReportPage: { type: String, default: null }
	},
	{
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
);

mongoose.model("competitionSegments", competitionSegmentSchema);
