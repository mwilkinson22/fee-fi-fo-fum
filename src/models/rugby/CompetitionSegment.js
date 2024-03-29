const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;

const competitionTypes = require("../../constants/competitionTypes");
import playerOfTheMatchTitles from "~/constants/playerOfTheMatchTitles";

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
		instances: [
			{
				year: { type: Number, required: true },
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
						},
						playerOfTheMatchTitle: {
							type: String,
							enum: Object.keys(playerOfTheMatchTitles).concat([null]), // We need to do this concat to accept new null values
							default: null
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
				manOfSteelPointsGoneDark: { type: Boolean, default: false },
				scoreOnly: { type: Boolean, default: true },
				sharedSquads: [
					{
						_team: { type: Schema.Types.ObjectId, ref: "teams", required: true },
						sharedWith: [{ type: Schema.Types.ObjectId, ref: "teams", required: true }]
					}
				],
				totalRounds: { type: Number, default: null },
				usesWinPc: { type: Boolean, default: false },
				usesExtraInterchange: { type: Boolean, default: false }
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

mongooseDebug(competitionSegmentSchema);

export function getSegmentBasicTitle(doc) {
	if (!doc._parentCompetition || !doc._parentCompetition.name) {
		return undefined;
	} else {
		//Get Parent Competition Name
		let value = doc._parentCompetition.name;

		//Append segment name where necessary
		if (doc.appendCompetitionName) {
			value += ` ${doc.name}`;
		}

		return value;
	}
}

competitionSegmentSchema.virtual("basicTitle").get(function() {
	return getSegmentBasicTitle(this);
});

mongoose.model("competitionSegments", competitionSegmentSchema);
