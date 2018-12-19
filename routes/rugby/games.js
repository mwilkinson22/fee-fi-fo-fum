const mongoose = require("mongoose");
const collectionName = "games";

//Models
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");

//Controllers
const GenericController = require("../../controllers/rugby/generic_controller")(collectionName);

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

module.exports = app => {
	//Getters
	app.get("/api/games/fixtures", async (req, res) => {
		const games = await Game.find({ date: { $gt: new Date() } })
			.sort({ date: 1 })
			.populate("_ground")
			.populate("_opposition");
		res.send(games);
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
