//Controllers
import * as gamesController from "../../controllers/rugby/gamesController";

//Middleware
import requireAdmin from "../../middlewares/requireAdmin";

export default app => {
	//Getters
	app.get("/api/games/admin/:ids", requireAdmin, gamesController.getGamesForAdmin);
	app.get("/api/games/gamepage/:ids", gamesController.getGamesForGamePage);
	app.get("/api/games/basic/:ids", gamesController.getBasicGames);
	app.get(
		"/api/games/fixtureListImage/:year/:competitions",
		gamesController.fetchFixtureListImage
	);
	app.get("/api/games/:_id/images/pregame", requireAdmin, gamesController.fetchPregameImage);
	app.get("/api/games/:_id/images/squad", requireAdmin, gamesController.fetchSquadImage);
	app.get("/api/games/crawl/local", requireAdmin, gamesController.crawlLocalGames);
	app.get("/api/games", gamesController.getList);

	//Crawlers
	app.get("/api/games/:_id/crawl", requireAdmin, gamesController.fetchExternalGame);

	//Putters
	app.put("/api/games/:_id/motm", requireAdmin, gamesController.setMotm);
	app.put("/api/games/:_id/stats", requireAdmin, gamesController.setStats);
	app.put("/api/games/:_id/event/imagePreview", requireAdmin, gamesController.fetchEventImage);
	app.put("/api/games/:_id/event", requireAdmin, gamesController.handleEvent);
	app.put("/api/games/:_id/squadsAnnounced", requireAdmin, gamesController.markSquadsAsAnnounced);
	app.put("/api/games/:_id/squad", requireAdmin, gamesController.setSquads);
	app.put("/api/games/:_id/manOfSteel", requireAdmin, gamesController.setManOfSteelPoints);
	app.put("/api/games/:_id/", requireAdmin, gamesController.updateGame);

	//Post
	app.post("/api/games/calendar", gamesController.createCalendar);
	app.post("/api/games/fixtureListImage/", gamesController.postFixtureListImage);
	app.post("/api/games", requireAdmin, gamesController.addGame);

	//Deleters
	app.delete("/api/games/:_id/event/:_event", requireAdmin, gamesController.deleteEvent);
};
