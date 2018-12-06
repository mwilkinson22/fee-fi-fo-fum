const mongoose = require("mongoose");
const collectionName = "games";
const Game = mongoose.model(collectionName);
const Team = mongoose.model("teams");

//Middleware
const requireAdmin = require("../../middlewares/requireAdmin");

//Getters
const getItemById = require("../../middlewares/getters/getItemById");
const getItemBySlug = require("../../middlewares/getters/getItemBySlug");

module.exports = app => {
	//Get
	app.get("/api/games/:id", async (req, res) => {
		getItemById(collectionName, req.params.id, req, res);
	});
	app.get("/api/games/slug/:slug", async (req, res) => {
		getItemBySlug(collectionName, req.params.slug, req, res);
	});

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
