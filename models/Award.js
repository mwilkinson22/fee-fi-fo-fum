const mongoose = require("mongoose");
const { Schema } = mongoose;

const awardSchema = new Schema({
	year: { type: Number, required: true, unique: true },
	name: { type: String, default: null },
	votingBegins: { type: Date, required: true },
	votingEnds: { type: Date, required: true },
	categories: [
		{
			name: { type: String, required: true },
			awardType: { type: String, required: true, enum: ["game", "player", "custom"] },
			nominees: [
				{
					nominee: { type: Schema.Types.Mixed, required: true },
					stats: [String],
					description: { type: String, default: null }
				}
			]
		}
	],
	votes: [
		{
			ip: { type: String, required: true },
			choices: [
				{
					categoryId: { type: Schema.Types.ObjectId },
					choice: { type: Schema.Types.ObjectId }
				}
			]
		}
	]
});

mongoose.model("awards", awardSchema);
