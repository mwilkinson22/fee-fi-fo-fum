const { mongooseDebug } = require("~/middlewares/mongooseDebug");

const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const playerStatTypes = require("../../constants/playerStatTypes");

const playerStatsCollectionSchema = new Schema(
	//Adds all stat keys to schema as Numbers
	_.mapValues(playerStatTypes, (content, key) => {
		const defaultZero = ["T", "CN", "PK", "DG", "MG", "YC", "RC"];
		return { type: Number, default: defaultZero.indexOf(key) === -1 ? null : 0 };
	})
);

mongooseDebug(playerStatsCollectionSchema);

module.exports = playerStatsCollectionSchema;
