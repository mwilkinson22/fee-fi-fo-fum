//Controller
import * as competitionController from "../../controllers/rugby/competitionController";

//Middleware
import requireAdmin from "~/middlewares/requireAdmin";

module.exports = app => {
	//Get
	app.get("/api/competitions/segments", competitionController.getSegments);
	app.get("/api/competitions", competitionController.getCompetitions);

	//Post
	app.post("/api/competitions", requireAdmin, competitionController.createCompetition);

	//Put
	app.put("/api/competitions/:_id", requireAdmin, competitionController.updateCompetition);

	//Delete
	app.delete("/api/competitions/:_id", requireAdmin, competitionController.deleteCompetition);
};
