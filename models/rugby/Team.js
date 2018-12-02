const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamSchema = new Schema({
	name: {
		long: String,
		short: String
	},
	nickname: String,
	_ground: { type: Schema.Types.ObjectId, ref: "grounds" },
	hashtagPrefix: String,
	colours: {
		main: String,
		trim1: String,
		trim2: String,
		text: String,
		pitchColour: String,
		statBarColour: String
	},
	shirt: [
		{
			colour: String,
			sleeveTrim: { type: String, default: null },
			collarTrim: { type: String, default: null },
			pattern: [
				{
					style: String,
					color: String
				}
			]
		}
	]
});

mongoose.model("teams", teamSchema);
