const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatTypes = require("../../constants/playerStatTypes");

const playerStatsCollectionSchema = new Schema(
	//Adds all stat keys to schema as Numbers
	_.mapValues(playerStatTypes, () => {
		return Number;
	})
);

module.exports = playerStatsCollectionSchema;
