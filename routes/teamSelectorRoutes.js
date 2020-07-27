//Controllers
import * as teamSelectorController from "~/controllers/teamSelectorController";

//Middleware
import requireAdmin from "~/middlewares/requireAdmin";

export default app => {
	//Getters
	app.get("/api/teamSelectors/game/:_game", teamSelectorController.getTeamSelectorForGame);
	app.get("/api/teamSelectors/:_id/previewImage", teamSelectorController.getPreviewImage);
	app.get("/api/teamSelectors/:_id", teamSelectorController.getTeamSelector);
	app.get("/api/teamSelectors/", teamSelectorController.getAllTeamSelectors);

	//Share User Choices
	app.post("/api/teamSelectors/:_id/share", teamSelectorController.shareSelector);

	//Save User Choices
	app.post("/api/teamSelectors/:_id/choices", teamSelectorController.submitUserChoices);

	//Create
	app.post("/api/teamSelectors/", requireAdmin, teamSelectorController.createTeamSelector);

	//Update
	app.put("/api/teamSelectors/:_id", requireAdmin, teamSelectorController.updateTeamSelector);

	//Delete
	app.delete("/api/teamSelectors/:_id", requireAdmin, teamSelectorController.deleteTeamSelector);
};
