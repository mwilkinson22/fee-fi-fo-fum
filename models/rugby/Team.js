const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamSchema = new Schema({
	name: {
		long: { type: String, required: true },
		short: { type: String, required: true }
	},
	nickname: { type: String, required: true },
	_defaultGround: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
	_grounds: [
		{
			_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
			_teamType: { type: Schema.Types.ObjectId, ref: "teamTypes", required: true }
		}
	],
	hashtagPrefix: { type: String, required: true },
	colours: {
		main: { type: String, required: true },
		trim1: { type: String, required: true },
		trim2: { type: String, required: true },
		text: { type: String, required: true },
		pitchColour: { type: String, default: null },
		statBarColour: { type: String, default: null }
	},
	squads: {
		type: [
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
		default: []
	},
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
	}
});

teamSchema.query.fullTeam = function() {
	return this.populate({
		path: "squads.players._player",
		select: "name position playingPositions isPlayer isCoach image twitter gender"
	});
};

mongoose.model("teams", teamSchema);
