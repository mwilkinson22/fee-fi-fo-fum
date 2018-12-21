const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSegmentSchema = new Schema({
	parentCompetition: {
		type: Schema.Types.ObjectId,
		ref: "competitions"
	},
	type: { type: String, enum: competitionTypes },
	name: String,
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
			]
		}
	]
});

mongoose.model("competitionSegments", competitionSegmentSchema);
