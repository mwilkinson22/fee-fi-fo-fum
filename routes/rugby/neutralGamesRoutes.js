//Controllers
import * as neutralGamesController from "../../controllers/rugby/neutralGamesController";

//Middleware
import requireAdmin from "../../middlewares/requireAdmin";

module.exports = app => {
	//Getters
	app.get("/api/neutralGames/crawl", requireAdmin, neutralGamesController.crawl);
	app.get(
		"/api/neturalGames/crawlAndUpdate",
		requireAdmin,
		neutralGamesController.crawlAndUpdate
	);
	app.get("/api/neutralGames", neutralGamesController.getList);

	//Put
	app.put("/api/neutralGames", requireAdmin, neutralGamesController.updateGames);

	//Post
	app.post("/api/neutralGames", requireAdmin, neutralGamesController.createNeutralGames);

	//Delete
	app.delete("/api/neutralGames/:_id", requireAdmin, neutralGamesController.deleteGame);
};
