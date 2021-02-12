//Controllers
import * as gamesController from "../../controllers/rugby/gamesController";

//Middleware
import requireAdmin from "../../middlewares/requireAdmin";

export default app => {
	//Public Calendar URL
	app.get("/calendar/", gamesController.getCalendar);

	//Update game list social cards
	app.get(
		"/api/games/gameListSocialCards",
		requireAdmin,
		gamesController.updateAllGameListSocialCards
	);

	//Get games for homepage
	app.get("/api/games/homepage", gamesController.getHomePageGames);

	//Get game years
	app.get("/api/games/years", gamesController.getGameYears);

	//Get game by slug
	app.get("/api/games/slug/:slug/", gamesController.getGameFromSlug);

	//Get fullGame items by data level
	app.get("/api/games/admin/:ids", requireAdmin, gamesController.getGamesForAdmin);
	app.get("/api/games/gamepage/:ids", gamesController.getGamesForGamePage);
	app.get("/api/games/basic/:ids", gamesController.getBasicGames);

	//Images
	app.post("/api/games/images/fixtureList/", requireAdmin, gamesController.postFixtureListImage);
	app.get(
		"/api/games/images/fixtureList/:year/:competitions",
		gamesController.fetchFixtureListImage
	);
	app.get("/api/games/images/pregame/:_id", requireAdmin, gamesController.fetchPregameImage);
	app.get("/api/games/images/squad/:_id", requireAdmin, gamesController.fetchSquadImage);

	//Get gameList items
	app.get("/api/games/list", requireAdmin, gamesController.getEntireList);
	app.get("/api/games/listByIds/:ids", gamesController.getListByIds);
	app.get("/api/games/listByYear/:year", gamesController.getListByYear);

	//Crawlers
	app.get("/api/games/:_id/crawl", requireAdmin, gamesController.fetchExternalGame);

	//Post Game Event
	app.post("/api/games/:_id/postGameEvents", requireAdmin, gamesController.submitPostGameEvents);
	app.put(
		"/api/games/:_id/postGameEvent/imagePreview",
		requireAdmin,
		gamesController.fetchPostGameEventImage
	);

	//Putters
	app.put("/api/games/:_id/stats", requireAdmin, gamesController.setStats);
	app.put("/api/games/:_id/event/imagePreview", requireAdmin, gamesController.fetchEventImage);
	app.put("/api/games/:_id/event", requireAdmin, gamesController.handleEvent);
	app.put("/api/games/:_id/squadsAnnounced", requireAdmin, gamesController.markSquadsAsAnnounced);
	app.put("/api/games/:_id/squad", requireAdmin, gamesController.setSquads);
	app.put("/api/games/:_id/", requireAdmin, gamesController.updateGame);

	//Post
	app.post("/api/games/:_game/fan-potm-vote/:_player", gamesController.saveFanPotmVote);
	app.post("/api/games/crawled", gamesController.addCrawledGames);
	app.post("/api/games", requireAdmin, gamesController.addGame);

	//Deleters
	app.delete("/api/games/:_id/event/:_event", requireAdmin, gamesController.deleteEvent);
	app.delete("/api/games/:_id/", requireAdmin, gamesController.deleteGame);
};
