const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamSelectorSchema = new Schema({
	title: { type: String, required: true },
	slug: { type: String, required: true, unique: true },
	interchanges: { type: Number, required: true, default: 0 },
	players: [{ type: Schema.Types.ObjectId, ref: "people" }],
	numberFromTeam: { type: Schema.Types.ObjectId, ref: "teams" },
	numberFromSquad: { type: Schema.Types.ObjectId, ref: "teams.squads" },
	defaultSocialText: { type: String, default: null },
	socialCard: { type: String, default: null },
	canvasText1: { type: String, default: null },
	canvasText2: { type: String, default: null },
	choices: {
		type: [
			{
				ip: { type: String, required: true },
				squad: [{ type: Schema.Types.ObjectId, ref: "people" }]
			}
		],
		default: []
	}
});

mongoose.model("teamSelectors", teamSelectorSchema);
