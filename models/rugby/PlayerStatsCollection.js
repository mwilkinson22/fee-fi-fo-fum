const mongoose = require("mongoose");
const { Schema } = mongoose;

const playerStatsCollectionSchema = new Schema({
	scoring: {
		T: { type: Number, default: 0 },
		CN: { type: Number, default: 0 },
		PK: { type: Number, default: 0 },
		DG: { type: Number, default: 0 },
		MG: { type: Number, default: 0 },
		TA: { type: Number, default: null }
	},
	attack: {
		TB: { type: Number, default: null },
		AT: { type: Number, default: null },
		C: { type: Number, default: null },
		M: { type: Number, default: null },
		CB: { type: Number, default: null },
		DR: { type: Number, default: null },
		E: { type: Number, default: null },
		FT: { type: Number, default: null },
		OF: { type: Number, default: null }
	},
	defence: {
		TK: { type: Number, default: null },
		MT: { type: Number, default: null },
		MI: { type: Number, default: null },
		P: { type: Number, default: null },
		YC: { type: Number, default: null },
		DC: { type: Number, default: null }
	}
});

module.exports = playerStatsCollectionSchema;
