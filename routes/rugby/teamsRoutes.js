//Controllers
import * as teamsController from "../../controllers/rugby/teamsController";

//Middleware
import requireAdmin from "../../middlewares/requireAdmin";

export default app => {
	//Getters
	app.get("/api/teamTypes", teamsController.getTeamTypes);
	app.get("/api/teams/", teamsController.getList);
	app.get("/api/team/:_id", teamsController.getTeam);

	//Putters
	app.put("/api/teamTypes/:_id", teamsController.updateTeamType);
	app.put("/api/teams/:_id/squad/:squadId/append", requireAdmin, teamsController.appendSquad);
	app.put("/api/teams/:_id/squad/:squadId", requireAdmin, teamsController.updateSquad);
	app.put("/api/teams/:_id/coaches", requireAdmin, teamsController.updateCoaches);
	app.put("/api/teams/:_id", requireAdmin, teamsController.updateTeam);

	//Post
	app.post("/api/teamTypes", teamsController.createTeamType);
	app.post("/api/teams/:_id/coaches", requireAdmin, teamsController.addCoach);
	app.post("/api/teams/:_id/squad/", requireAdmin, teamsController.createSquad);
	app.post("/api/teams/", requireAdmin, teamsController.createTeam);

	//Deleters
	app.delete("/api/teams/:_id", teamsController.deleteTeam);
	app.delete("/api/teamTypes/:_id", teamsController.deleteTeamType);
};
