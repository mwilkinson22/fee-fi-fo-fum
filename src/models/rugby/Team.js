const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const mongoose = require("mongoose");
const { Schema } = mongoose;
import coachTypes from "~/constants/coachTypes";
import teamIdentityFields from "~/constants/teamIdentityFields";

const teamSchema = new Schema({
	...teamIdentityFields,
	_defaultGround: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
	_grounds: [
		{
			_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
			_teamType: { type: Schema.Types.ObjectId, ref: "teamTypes", required: true }
		}
	],
	previousIdentities: [
		{
			...teamIdentityFields,
			fromYear: { type: Number, required: true },
			toYear: { type: Number, required: true }
		}
	],
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

mongooseDebug(teamSchema);

teamSchema.query.forList = function () {
	return this.select("name colours images");
};

teamSchema.query.fullTeam = function (fullData) {
	if (fullData) {
		return this.populate({
			path: "squads.players._player",
			select: "name position playingPositions isPlayer isCoach images.main images.player twitter gender slug contractedUntil removeFromOocList"
		}).populate({
			path: "coaches._person",
			select: "name slug images.main images.coach gender"
		});
	} else {
		return this.select("name nickname playerNickname colours images previousIdentities");
	}
};

mongoose.model("teams", teamSchema);
