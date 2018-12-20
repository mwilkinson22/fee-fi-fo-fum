const _ = require("lodash");
const mongoose = require("mongoose");
const collectionName = "games";

//Models
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");

//Controllers
const GenericController = require("../../controllers/rugby/generic_controller")(collectionName);
const GameController = require("../../controllers/rugby/games_controller");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	//Getters
	app.get("/api/games/fixtures/", GameController.getFixtures);
	app.get("/api/games/results/years", GameController.getYearsWithResults);
	app.get("/api/games/filters/:year", GameController.getFilters);
	app.get("/api/games/results/:year", GameController.getResults);

	app.get("/api/games/getTeamsByYear", async (req, res) => {
		const team_Ids = await Game.find({}).distinct("_opposition");
		const teams = await Team.find({ _id: { $in: team_Ids } }, { "name.long": 1 }).sort({
			"name.long": 1
		});

		res.send();
	});
	app.get("/api/games/:id", GenericController.getItemById);
	app.get("/api/games/slug/:slug", GenericController.getItemBySlug);

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
