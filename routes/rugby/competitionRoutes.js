//Controller
import * as competitionController from "../../controllers/rugby/competitionController";

//Middleware
import requireAdmin from "~/middlewares/requireAdmin";

export default app => {
	//Get
	app.get(
		"/api/competitions/leagueTableData/:_segment/:year",
		competitionController.getLeagueTableData
	);
	app.get(
		"/api/competitions/segments/:_segment/instance/:_instance/image/:imageType",
		requireAdmin,
		competitionController.fetchCompetitionInstanceImage
	);
	app.get(
		"/api/competitions/segments/:_segment/crawlNewGames",
		requireAdmin,
		competitionController.crawlNewGames
	);
	app.get("/api/competitions/segments", competitionController.getSegments);
	app.get("/api/competitions", competitionController.getCompetitions);

	//Post
	app.post(
		"/api/competitions/segments/:_segment/instance/:_instance/image",
		requireAdmin,
		competitionController.postCompetitionInstanceImage
	);
	app.post(
		"/api/competitions/segments/:segmentId/instance",
		requireAdmin,
		competitionController.createInstance
	);
	app.post("/api/competitions/segments", requireAdmin, competitionController.createSegment);
	app.post("/api/competitions", requireAdmin, competitionController.createCompetition);

	//Put
	app.put(
		"/api/competitions/segments/:segmentId/instance/:instanceId",
		requireAdmin,
		competitionController.updateInstance
	);
	app.put("/api/competitions/segments/:_id", requireAdmin, competitionController.updateSegment);
	app.put("/api/competitions/:_id", requireAdmin, competitionController.updateCompetition);

	//Delete
	app.delete(
		"/api/competitions/segments/:segmentId/instance/:instanceId",
		requireAdmin,
		competitionController.deleteInstance
	);
	app.delete(
		"/api/competitions/segments/:_id",
		requireAdmin,
		competitionController.deleteSegment
	);
	app.delete("/api/competitions/:_id", requireAdmin, competitionController.deleteCompetition);
};
