const mongoose = require("mongoose");
const { Schema } = mongoose;

const awardSchema = new Schema({
	year: { type: Number, required: true, unique: true },
	name: { type: String, default: null },
	votingBegins: { type: Date, default: null },
	votingEnds: { type: Date, default: null },
	categories: [
		{
			name: { type: String, required: true },
			awardType: { type: String, required: true, enum: ["game", "player", "custom"] },
			nominees: [
				{
					//Only one of the following three will be used, corresponding to "awardType" above
					gameId: { type: Schema.Types.ObjectId, ref: "games", default: null },
					playerId: { type: Schema.Types.ObjectId, ref: "people", default: null },
					name: { type: String, default: null },

					//A list of stat keys for player and game awards
					stats: [String],

					//To be used by all types
					description: { type: String, default: null }
				}
			]
		}
	],
	votes: [
		{
			ip: { type: String, required: true, unique: true },
			choices: [
				{
					categoryId: { type: mongoose.Types.ObjectId },
					choice: { type: mongoose.Types.ObjectId }
				}
			]
		}
	]
});

mongoose.model("awards", awardSchema);
