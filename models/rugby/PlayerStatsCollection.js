const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatTypes = require("../../constants/playerStatTypes");

const playerStatsCollectionSchema = new Schema(
	//The first mapValues allows us to filter by category (scoring/attack/defence)
	_.mapValues(playerStatTypes, stats => {
		//The second mapValues pulls the stat's initials as a field, and sets it to be a number
		return _.mapValues(stats, stat => {
			return { type: Number, default: null };
		});
	})
);

module.exports = playerStatsCollectionSchema;
