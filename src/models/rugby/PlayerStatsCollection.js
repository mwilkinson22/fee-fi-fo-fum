const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const { getDefaultPlayerStatsObject } = require("~/helpers/gameHelper");

const playerStatsCollectionSchema = new Schema(
	//Adds all stat keys to schema as Numbers
	_.mapValues(getDefaultPlayerStatsObject(false), defaultValue => ({ type: Number, default: defaultValue }))
);

mongooseDebug(playerStatsCollectionSchema);

module.exports = playerStatsCollectionSchema;
