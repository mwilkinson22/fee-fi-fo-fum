const mongoose = require("mongoose");
const { Schema } = mongoose;
import coachTypes from "~/constants/coachTypes";

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
	},
	coaches: [
		{
			_person: { type: Schema.Types.ObjectId, ref: "people", required: true },
			from: { type: Date, required: true },
			to: { type: Date, default: null },
			role: { type: String, required: true, enum: coachTypes.map(c => c.key) },
			_teamType: { type: Schema.Types.ObjectId, ref: "teamTypes", required: true }
		}
	]
});

teamSchema.query.forList = function() {
	return this.select("name colours images");
};

teamSchema.query.fullTeam = function(fullData) {
	if (fullData) {
		return this.populate({
			path: "squads.players._player",
			select:
				"name position playingPositions isPlayer isCoach images.main images.player twitter gender slug dateOfBirth contractedUntil _hometown"
		}).populate({
			path: "coaches._person",
			select: "name slug images.main images.coach gender"
		});
	} else {
		return this.select("name nickname colours images");
	}
};

mongoose.model("teams", teamSchema);
