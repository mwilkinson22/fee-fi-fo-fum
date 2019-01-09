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
		main: [Number],
		trim1: [Number],
		trim2: [Number],
		text: [Number],
		pitchColour: [Number],
		statBarColour: [Number]
	},
	squads: [
		{
			year: Number,
			_teamType: {
				type: Schema.Types.ObjectId,
				ref: "teamTypes"
			},
			players: [
				{
					_player: { type: Schema.Types.ObjectId, ref: "people" },
					number: Number,
					from: Date,
					to: Date,
					onLoan: Boolean,
					friendlyOnly: Boolean
				}
			]
		}
	],
	shirt: [
		{
			year: Number,
			colour: [Number],
			sleeveTrim: { type: [Number], default: null },
			collarTrim: { type: [Number], default: null },
			pattern: [
				{
					style: String,
					colour: [[Number]]
				}
			]
		}
	],
	image: String
});

mongoose.model("teams", teamSchema);
