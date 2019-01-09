const mongoose = require("mongoose");
const collectionName = "games";
const pipelines = require("../../pipelines/rugby/gamesPipelines");

//Models
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");

//Controllers
const GenericController = require("../../controllers/genericController")(
	collectionName,
	pipelines.getFullGame
);

const GameController = require("../../controllers/rugby/gamesController");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	//Getters
	app.get("/api/games/slug/:slug", GenericController.getItemBySlug);
	app.get("/api/games/:year/:teamType", GameController.getGames);

	app.get("/api/games/lists", GameController.getLists);
	app.get("/api/games/frontpage", GameController.getFrontpageGames);
	app.get("/api/games/:id", GenericController.getItemById);

	app.post("/api/games", requireAdmin, async (req, res) => {
		const { data } = req.body;

		//Add ground
		if (!data._ground) {
			const opposition = await Team.findById(data._opposition);
			data._ground = opposition._ground;
		}

		const game = await new Game({
			...data,

			//Create Slug
			slug: Game.generateSlug(data._opposition, data.date),

			//Convert DOB to date format
			date: new Date(data.date)
		});

		await game.save();

		res.send(game);
	});
};
