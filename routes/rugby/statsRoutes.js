const mongoose = require("mongoose");

//Models
const Game = mongoose.model("games");

//Middleware & Utils
const requireAdmin = require("../../middlewares/requireAdmin");

//Consts
const playerStatTypes = require("../../constants/playerStatTypes.js");

module.exports = app => {
	app.get("/api/stats/playerStatTypes", (req, res) => {
		res.send(playerStatTypes);
	});
};
