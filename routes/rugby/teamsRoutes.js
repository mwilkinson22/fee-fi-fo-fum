const mongoose = require("mongoose");
const collectionName = "teams";

//Models
const Team = mongoose.model(collectionName);
const IdLink = mongoose.model("IdLinks");

//Controllers
const GenericController = require("../../controllers/genericController")(collectionName);
const TeamController = require("../../controllers/rugby/teamsController");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	app.get("/api/teams/:id", GenericController.getItemById);
	app.get("/api/teams/squads/years/:team", TeamController.getYearsWithSquads);
	app.get("/api/teams/squads/:team/:year", TeamController.getSquadByYear);
};
