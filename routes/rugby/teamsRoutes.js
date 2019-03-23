//Controllers
const teamsController = require("../../controllers/rugby/teamsController");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	//Getters
	app.get("/api/teamTypes", teamsController.getTeamTypes);
	app.get("/api/teams/", teamsController.getList);
	app.get("/api/team/:id", teamsController.getTeam);

	//Putters
	app.put("/api/teams/:_id", requireAdmin, teamsController.update);
};
