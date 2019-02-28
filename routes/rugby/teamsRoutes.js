const mongoose = require("mongoose");
const collectionName = "teams";

//Models
const TeamTypes = mongoose.model("teamTypes");

//Controllers
const GenericController = require("../../controllers/genericController")(collectionName);
const TeamController = require("../../controllers/rugby/teamsController");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	app.get("/api/teamTypes", async (req, res) => {
		const teamTypes = await TeamTypes.find({}).sort({ sortOrder: 1 });
		res.send(teamTypes);
	});
	app.get("/api/teams/", TeamController.getAll);
	app.get("/api/teams/:id", GenericController.getItemById);
	app.get("/api/teams/squads/years/:team", TeamController.getYearsWithSquads);
	app.get("/api/teams/squads/:team/:year", TeamController.getSquadByYear);

	app.put("/api/teams/:_id", TeamController.update);
};
