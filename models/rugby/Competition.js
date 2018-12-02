const mongoose = require("mongoose");
const { Schema } = mongoose;
const competitionTypes = require("../../constants/competitionTypes");

const competitionSchema = new Schema({
	type: { type: String, enum: competitionTypes },
	playerLimit: { type: Boolean, default: "true" },
	segments: [
		{
			type: { type: String, enum: competitionTypes },
			name: String,
			appendCompetitionName: Boolean,
			_pointsCarriedFrom: {
				type: Schema.Types.ObjectId,
				ref: "users.segments"
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
							overwriteBaseHashtag: Boolean
						}
					],
					teams: [{ type: Schema.Types.ObjectId, ref: "teams" }]
				}
			]
		}
	]
});

mongoose.model("competitions", competitionSchema);
