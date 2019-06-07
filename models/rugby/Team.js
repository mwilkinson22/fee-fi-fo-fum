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
	images: {
		main: { type: String, required: true },
		light: { type: String, default: null },
		dark: { type: String, default: null }
	},
	slug: String
});

teamSchema.query.fullTeam = function() {
	return this.populate({
		path: "squads.players._player",
		select: "name position playerDetails slug isPlayer isCoach image twitter"
	});
};

mongoose.model("teams", teamSchema);
