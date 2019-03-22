const mongoose = require("mongoose");
const collectionName = "teams";

//Models
const TeamTypes = mongoose.model("teamTypes");

//Controllers
const GenericController = require("../../controllers/genericControllerLegacy")(collectionName);
const TeamController = require("../../controllers/rugby/teamsController");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	app.get("/api/teamTypes", async (req, res) => {
		const teamTypes = await TeamTypes.find({}).sort({ sortOrder: 1 });
		res.send(teamTypes);
	});
	app.get("/api/teams/", TeamController.getList);
	app.get("/api/team/:id", TeamController.getTeam);

	app.put("/api/teams/:_id", requireAdmin, TeamController.update);
};
